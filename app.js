let provider;
let signer;
let contract;
let lastCreatedId = null;


const ABI = [
  "function productCount() view returns (uint256)",

  "function createProduct(string,address[],address)",
  "function updateDeliveries(uint256,address[])",

  "function shipProduct(uint256)",
  "function receiveProduct(uint256)",

  "function getProduct(uint256) view returns (uint256,string,uint8,address,address[],address)",
  "function getHistoryCount(uint256) view returns (uint256)",
  "function getHistoryByIndex(uint256,uint256) view returns (uint8,address,uint256)"
];

// Đặt/thay đổi địa chỉ Smart Contract cho phần Xem thông tin
function setContractAddress() {
  const addrInput = document.getElementById("contractAddress");
  if (!addrInput || !addrInput.value) {
    const msgEl = document.getElementById("contractMsg");
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = "❌ Vui lòng nhập địa chỉ contract";
    }
    return;
  }

  const addr = addrInput.value.trim();
  // Kiểm tra format địa chỉ Ethereum
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    const msgEl = document.getElementById("contractMsg");
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = "❌ Địa chỉ không hợp lệ (phải là 0x... 40 ký tự hex)";
    }
    return;
  }

  currentContractAddress = addr;
  const msgEl = document.getElementById("contractMsg");
  if (msgEl) {
    msgEl.style.color = "green";
    msgEl.innerText = "✅ Đã đặt contract: " + addr.slice(0, 10) + "..." + addr.slice(-8);
  }
}

// Đặt/thay đổi địa chỉ Smart Contract cho phần Nghiệp vụ
function setLeftContractAddress() {
  const addrInput = document.getElementById("leftContractAddress");
  if (!addrInput || !addrInput.value) {
    const msgEl = document.getElementById("leftContractMsg");
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = "❌ Vui lòng nhập địa chỉ contract";
    }
    return;
  }

  const addr = addrInput.value.trim();
  // Kiểm tra format địa chỉ Ethereum
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    const msgEl = document.getElementById("leftContractMsg");
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = "❌ Địa chỉ không hợp lệ (phải là 0x... 40 ký tự hex)";
    }
    return;
  }

  currentContractAddress = addr;
  const msgEl = document.getElementById("leftContractMsg");
  if (msgEl) {
    msgEl.style.color = "green";
    msgEl.innerText = "✅ Đã đặt contract: " + addr.slice(0, 10) + "..." + addr.slice(-8);
  }
}

async function connectWallet() {
  try {
    if (!window.ethereum) {
      const accEl = document.getElementById("account");
      if (accEl) accEl.innerText = "Cài MetaMask trước! (cài MetaMask và thử lại)";
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    // Yêu cầu quyền truy cập tài khoản để MetaMask hiện hộp cho phép
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();
    contract = new ethers.Contract(currentContractAddress, ABI, signer);

    const addr = await signer.getAddress();
    document.getElementById("account").innerText = "👤 " + addr;
  } catch (e) {
    alert("❌ Lỗi kết nối: " + (e.message || e));
    console.error(e);
  }
}

async function createProduct() {
  try {
    const name = document.getElementById("productName").value;
    const deliveries = document
      .getElementById("deliveryList")
      .value.split(",")
      .map(a => a.trim());

    const retailer = document.getElementById("retailerAddress").value;

    const tx = await contract.createProduct(name, deliveries, retailer);
    await tx.wait();

    // Lấy productCount để suy ra ID mới (giả sử productCount là tổng, ID mới = count - 1)
    try {
      const count = await contract.productCount();
      const id = Number(count) - 1;
      lastCreatedId = id;
      const createdEl = document.getElementById('createdId');
      if (createdEl) {
        createdEl.style.color = 'green';
        createdEl.innerText = 'ID: ' + id;
      }
      const msgEl = document.getElementById("createMsg");
      const text = "✅ Tạo sản phẩm thành công — ID: " + id;
      if (msgEl) {
        msgEl.style.color = "green";
        msgEl.innerText = text;
      } else {
        alert(text);
      }
    } catch (innerE) {
      const msgEl = document.getElementById("createMsg");
      const text = "✅ Tạo sản phẩm thành công (không lấy được ID tự động)";
      if (msgEl) {
        msgEl.style.color = "green";
        msgEl.innerText = text;
      } else {
        alert(text);
      }
      console.warn('Không lấy được productCount để suy ID mới:', innerE);
    }
  } catch (e) {
    const msgEl = document.getElementById("createMsg");
    const errText = "❌ Lỗi: Chưa kết nối ví, hoặc ví giao hàng và nhận hàng sai.";
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = errText;
    } else {
      alert(errText);
    }
    console.error(e);
  }
}

// Hiển thị / sao chép ID vừa tạo; cũng điền vào ô ship/receive để người giao dễ sử dụng
function showCreatedId() {
  if (lastCreatedId === null) {
    alert('Chưa có ID sản phẩm mới. Tạo sản phẩm trước.');
    return;
  }

  const idStr = String(lastCreatedId);
  // copy to clipboard if supported
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(idStr).catch(() => {});
  }

  const shipInput = document.getElementById('shipId');
  const receiveInput = document.getElementById('receiveId');
  if (shipInput) shipInput.value = idStr;
  if (receiveInput) receiveInput.value = idStr;

}

async function shipProduct() {
  try {
    const id = document.getElementById("shipId").value;
    const tx = await contract.shipProduct(id);
    await tx.wait();
    const msgEl = document.getElementById("shipMsg");
    const text = "🚚 Đã ship sản phẩm";
    if (msgEl) {
      msgEl.style.color = "green";
      msgEl.innerText = text;
    } else {
      alert(text);
    }
  } catch (e) {
    const msgEl = document.getElementById("shipMsg");
    const errText = "❌ Lỗi: Chỉ ví được giao hàng mới có thể giao sản phẩm hoặc mã sản phẩm không tồn tại.";
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = errText;
    } else {
      alert(errText);
    }
    console.error(e);
  }
}

async function receiveProduct() {
  try {
    const id = document.getElementById("receiveId").value;
    const tx = await contract.receiveProduct(id);
    await tx.wait();
    const msgEl = document.getElementById("receiveMsg");
    const successText = "📦 Retailer đã nhận hàng";
    if (msgEl) {
      msgEl.style.color = "green";
      msgEl.innerText = successText;
    } else {
      alert(successText);
    }
  } catch (e) {
    const msgEl = document.getElementById("receiveMsg");
    const errText = "❌ Lỗi: chỉ ví được xác nhận mới có thể nhận hàng hoặc mã sản phẩm không tồn tại.";
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = errText;
    } else {
      alert(errText);
    }
    console.error(e);
  }
}

async function viewProduct() {
  try {
    const id = document.getElementById("viewId").value;
    
    if (!id) {
      throw new Error("Vui lòng nhập ID sản phẩm");
    }
    
    // Tạo contract read-only với địa chỉ hiện tại
    let readContract = contract;
    if (!contract || contract.getAddress() !== currentContractAddress) {
      if (!window.ethereum) {
        throw new Error("Không thể tạo provider. Cài MetaMask hoặc dùng RPC endpoint khác.");
      }
      const readProvider = new ethers.BrowserProvider(window.ethereum);
      readContract = new ethers.Contract(currentContractAddress, ABI, readProvider);
    }
    
    const p = await readContract.getProduct(id);

    let statusText = ["ĐÃ TẠO SẢN PHẨM", "ĐÃ GIAO HÀNG", "CỬA HÀNG ĐÃ NHẬN HÀNG"];

    let output = `
🆔 ID: ${p[0]}
📦 Tên: ${p[1]}
📌 Trạng thái: ${statusText[p[2]]}
🏭 Nhà sản xuất: ${p[3]}
🏪 Cửa hàng: ${p[5]}
🚚 Vận chuyển: ${p[4].join(", ")}
`;

    const count = await readContract.getHistoryCount(id);
    output += "\n📜 LỊCH SỬ:\n";

    for (let i = 0; i < count; i++) {
      const h = await readContract.getHistoryByIndex(id, i);
      output += `- ${statusText[h[0]]}
  👤  ${h[1]}
  ⏰ ${new Date(Number(h[2]) * 1000).toLocaleString()}
`;
    }

    document.getElementById("result").innerText = output;
    const viewMsgEl = document.getElementById("viewMsg");
    if (viewMsgEl) viewMsgEl.innerText = "";
  } catch (e) {
    const viewMsgEl = document.getElementById("viewMsg");
    const errText = "❌ Lỗi: " + (e.message || "không tìm thấy sản phẩm với ID này.");
    if (viewMsgEl) {
      viewMsgEl.style.color = "crimson";
      viewMsgEl.innerText = errText;
    } else {
      alert(errText);
    }
    // Xoá kết quả cũ khi có lỗi
    const resultEl = document.getElementById("result");
    if (resultEl) resultEl.innerText = "";
    console.error(e);
  }
}
