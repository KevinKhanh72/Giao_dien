let provider;
let signer;
let contract;
let lastCreatedId = null;
let currentContractAddress = "";


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

    // Kiểm tra xem người dùng đã đặt contract address chưa
    if (!currentContractAddress) {
      alert("❌ Vui lòng đặt địa chỉ Smart Contract trước khi kết nối ví!");
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    // Yêu cầu quyền truy cập tài khoản để MetaMask hiện hộp cho phép
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();
    contract = new ethers.Contract(currentContractAddress, ABI, signer);

    const addr = await signer.getAddress();
    const accEl = document.getElementById("account");
    if (accEl) {
      accEl.innerHTML = `👤 <strong>${addr}</strong><br><small style="color:#666;">✅ Đã kết nối thành công</small>`;
    }
    
    console.log("✅ Ví kết nối:", addr);
  } catch (e) {
    const accEl = document.getElementById("account");
    const errMsg = e.message || String(e);
    
    if (errMsg.includes("user rejected") || errMsg.includes("User rejected")) {
      if (accEl) accEl.innerText = "❌ Bạn đã từ chối kết nối";
      alert("❌ Bạn đã từ chối kết nối với MetaMask");
    } else if (errMsg.includes("Chain")) {
      if (accEl) accEl.innerText = "❌ Sai mạng blockchain";
      alert("❌ Lỗi: Bạn đang ở mạng blockchain khác. Vui lòng kiểm tra lại mạng trong MetaMask");
    } else {
      if (accEl) accEl.innerText = "❌ Lỗi: " + errMsg;
      alert("❌ Lỗi kết nối: " + errMsg);
    }
    console.error("Chi tiết lỗi kết nối:", e);
  }
}

async function createProduct() {
  try {
    if (!signer) {
      throw new Error("Chưa kết nối ví. Nhấn '🔗 Kết nối MetaMask' trước");
    }
    
    const name = document.getElementById("productName").value;
    const deliveries = document
      .getElementById("deliveryList")
      .value.split(",")
      .map(a => a.trim());

    const retailer = document.getElementById("retailerAddress").value;
    
    if (!name || !retailer || deliveries.length === 0 || !deliveries[0]) {
      throw new Error("Vui lòng điền đầy đủ: Tên sản phẩm, danh sách giao hàng, địa chỉ retailer");
    }

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
    let errText = "❌ Lỗi tạo sản phẩm: ";
    
    const msg = e.message || String(e);
    if (msg.includes("execution reverted")) {
      errText += "Giao dịch bị từ chối. Hãy kiểm tra:\n- Ví MetaMask có phải là nhà sản xuất?\n- Các địa chỉ delivery/retailer có hợp lệ?";
    } else if (msg.includes("not connected")) {
      errText += "Chưa kết nối ví";
    } else if (msg.includes("invalid")) {
      errText += "Địa chỉ không hợp lệ (phải là 0x...)";
    } else {
      errText += msg || "Có lỗi xảy ra";
    }
    
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = errText;
    } else {
      alert(errText);
    }
    console.error("Chi tiết lỗi tạo sản phẩm:", e);
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
    
    if (!id) {
      throw new Error("Vui lòng nhập ID sản phẩm");
    }
    
    if (!signer) {
      throw new Error("Chưa kết nối ví. Nhấn '🔗 Kết nối MetaMask' trước");
    }
    
    const currentAddr = await signer.getAddress();
    console.log("🔍 Debug ship hàng:");
    console.log("- ID sản phẩm:", id);
    console.log("- Ví hiện tại:", currentAddr);
    console.log("- Contract address:", currentContractAddress);
    
    // Lấy thông tin sản phẩm để kiểm tra
    let readProvider = new ethers.BrowserProvider(window.ethereum);
    let readContract = new ethers.Contract(currentContractAddress, ABI, readProvider);
    
    try {
      const product = await readContract.getProduct(id);
      console.log("- Thông tin sản phẩm:");
      console.log("  ID:", product[0]);
      console.log("  Tên:", product[1]);
      console.log("  Trạng thái:", product[2]);
      console.log("  Manufacturer:", product[3]);
      console.log("  Retailer:", product[5]);
      console.log("  Deliveries:", product[4]);
    } catch (err) {
      console.warn("Không lấy được thông tin sản phẩm:", err.message);
    }
    
    const tx = await contract.shipProduct(id);
    console.log("- Tx hash:", tx.hash);
    await tx.wait();
    console.log("✅ Giao dịch thành công");
    
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
    let errText = "❌ Lỗi ship: ";
    
    const msg = e.message || String(e);
    console.error("❌ Chi tiết lỗi ship:", e);
    console.error("Message:", msg);
    
    if (msg.includes("execution reverted")) {
      errText += "Smart Contract từ chối giao dịch. Kiểm tra:\n1. Ví hiện tại có nằm trong danh sách delivery?\n2. Trạng thái sản phẩm có cho phép ship không?\n3. Xem console (F12) để chi tiết";
    } else if (msg.includes("insufficient")) {
      errText += "Số dư gas không đủ";
    } else if (msg.includes("from")) {
      errText += "Lỗi ký giao dịch. Vui lòng kiểm tra MetaMask";
    } else if (msg.includes("not exist") || msg.includes("undefined")) {
      errText += "ID sản phẩm không tồn tại hoặc contract không có dữ liệu";
    } else {
      errText += msg || "Giao dịch bị từ chối";
    }
    
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = errText;
    } else {
      alert(errText);
    }
  }
}

async function receiveProduct() {
  try {
    const id = document.getElementById("receiveId").value;
    
    if (!id) {
      throw new Error("Vui lòng nhập ID sản phẩm");
    }
    
    if (!signer) {
      throw new Error("Chưa kết nối ví. Nhấn '🔗 Kết nối MetaMask' trước");
    }
    
    const currentAddr = await signer.getAddress();
    console.log("🔍 Debug nhận hàng:");
    console.log("- ID sản phẩm:", id);
    console.log("- Ví hiện tại:", currentAddr);
    console.log("- Contract address:", currentContractAddress);
    
    // Lấy thông tin sản phẩm để kiểm tra
    let readProvider = new ethers.BrowserProvider(window.ethereum);
    let readContract = new ethers.Contract(currentContractAddress, ABI, readProvider);
    
    try {
      const product = await readContract.getProduct(id);
      const retailerAddr = product[5].toLowerCase();
      const currentAddrLower = currentAddr.toLowerCase();
      
      console.log("- Thông tin sản phẩm:");
      console.log("  ID:", product[0]);
      console.log("  Tên:", product[1]);
      console.log("  Trạng thái:", product[2], "(0=tạo, 1=đã ship, 2=đã nhận)");
      console.log("  Manufacturer:", product[3]);
      console.log("  Retailer (yêu cầu):", retailerAddr);
      console.log("  Ví hiện tại:", currentAddrLower);
      console.log("  Khớp không?", retailerAddr === currentAddrLower ? "✅ CÓ" : "❌ KHÔNG");
      console.log("  Deliveries:", product[4]);
      
      if (retailerAddr !== currentAddrLower) {
        throw new Error(`❌ Ví hiện tại (${currentAddr}) không phải retailer của sản phẩm này.\nRetailer phải là: ${product[5]}`);
      }
    } catch (err) {
      console.error("❌ Lỗi kiểm tra sản phẩm:", err.message);
      throw err;
    }
    
    const tx = await contract.receiveProduct(id);
    console.log("- Tx hash:", tx.hash);
    await tx.wait();
    console.log("✅ Giao dịch thành công");
    
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
    let errText = "❌ Lỗi nhận hàng: ";
    
    const msg = e.message || String(e);
    console.error("❌ Chi tiết lỗi nhận hàng:", e);
    
    if (msg.includes("Only retailer")) {
      errText = "❌ CHỈ RETAILER MỚI CÓ THỂ NHẬN HÀNG!\n\nKiểm tra:\n1. Ví MetaMask hiện tại là gì?\n2. Retailer của sản phẩm là gì?\n3. Xem Console (F12) để so sánh địa chỉ";
    } else if (msg.includes("không phải retailer")) {
      errText = msg;
    } else if (msg.includes("execution reverted")) {
      errText += "Smart Contract từ chối giao dịch";
    } else if (msg.includes("insufficient")) {
      errText += "Số dư gas không đủ";
    } else {
      errText += msg || "Giao dịch bị từ chối";
    }
    
    if (msgEl) {
      msgEl.style.color = "crimson";
      msgEl.innerText = errText;
    } else {
      alert(errText);
    }
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
