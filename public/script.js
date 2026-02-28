document.addEventListener("DOMContentLoaded", () => {
  // 파일 목록 관련 리스트
  const videoList = document.getElementById("videoList");
  const audioList = document.getElementById("audioList");
  const imageList = document.getElementById("imageList");
  const otherList = document.getElementById("otherList");
  //파일 업로드 관련
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  //팝업 관련
  const previewPopup = document.getElementById("previewPopup");
  const popupMedia = document.getElementById("popupMedia");
  const closePopup = document.getElementById("closePopup");
  //파일 업로드 프로그래스 바
  const uploadProgressContainer = document.getElementById("uploadProgressContainer");
  const uploadProgressBar = document.getElementById("uploadProgressBar");
  //알림 컨테이너
  const notificationContainer = document.getElementById("notificationContainer");
  const searchInput = document.getElementById("searchInput");

  let allFiles = []; // 모든 파일 목록 저장용

  // 파일 크기 포맷팅 함수
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // 날짜 포맷팅 함수
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  // 파일 유형별 미리보기 렌더링 설정
  const previewSettings = {
    video: [".mp4", ".mov", ".avi"], // 동영상 확장자
    audio: [".mp3", ".wav", ".ogg", ".mid"], // 오디오 확장자
    image: [".jpg", ".png", ".jpeg", ".gif", ".bmp"], // 이미지 확장자
  };

  // 알람 생성 함수
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("hidden");
      setTimeout(() => notification.remove(), 1000);
    }, 2000);
  }

  // 썸네일 클릭 시 팝업 표시
  function showPreview(fileName, content) {
    document.getElementById("popupFileName").textContent = fileName;
    popupMedia.innerHTML = content;
    previewPopup.classList.remove("hidden");
    previewPopup.classList.add("visible");

    closePopup.onclick = () => {
      const mediaElement = popupMedia.querySelector("video, audio");
      if (mediaElement) {
        mediaElement.pause();
        mediaElement.currentTime = 0;
      }
      previewPopup.classList.add("hidden");
      previewPopup.classList.remove("visible");
    };
  }

  // 파일 삭제 함수
  window.deleteFile = async (fileName, event) => {
    event.stopPropagation();
    if (!confirm(`'${fileName}' 파일을 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/files/${fileName}`, { method: "DELETE" });
      if (response.ok) {
        showNotification("파일 삭제 성공!");
        loadFiles();
      } else {
        throw new Error("파일 삭제 실패");
      }
    } catch (err) {
      showNotification("파일 삭제 실패!");
      console.error(err);
    }
  };

  // 다운로드 함수
  window.handleDownload = (event) => {
    event.stopPropagation();
  };

  function showProgressBar() {
    uploadProgressContainer.classList.remove("hidden");
    uploadProgressBar.style.width = "0%";
  }

  function hideProgressBar() {
    setTimeout(() => {
      uploadProgressContainer.classList.add("hidden");
    }, 500);
  }

  async function uploadFiles(files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append("file", file);
    }

    try {
      showProgressBar();
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          uploadProgressBar.style.width = `${percentComplete}%`;
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          showNotification("파일 업로드 성공!");
          loadFiles();
        } else {
          showNotification("파일 업로드 실패!");
        }
        hideProgressBar();
      };

      xhr.onerror = () => {
        showNotification("파일 업로드 실패!");
        hideProgressBar();
      };

      xhr.send(formData);
    } catch (err) {
      console.error("업로드 중 오류:", err);
    }
  }

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("hover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("hover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("hover");
    uploadFiles(e.dataTransfer.files);
  });

  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => uploadFiles(e.target.files));

  searchInput.addEventListener("input", () => {
    renderFiles(searchInput.value.toLowerCase());
  });

  async function loadFiles() {
    try {
      const response = await fetch("/api/files");
      allFiles = await response.json();
      renderFiles();
    } catch (err) {
      console.error("파일 목록 로드 실패:", err);
    }
  }

  function renderFiles(filter = "") {
    videoList.innerHTML = "";
    audioList.innerHTML = "";
    imageList.innerHTML = "";
    otherList.innerHTML = "";

    allFiles.filter(file => file.name.toLowerCase().includes(filter)).forEach((file) => {
      const fileCard = document.createElement("div");
      fileCard.classList.add("file-card");

      const ext = file.extension.toLowerCase();
      let thumbnailHtml = "";

      if (previewSettings.video.includes(ext)) {
        thumbnailHtml = `<div class="thumbnail"><video src="${file.url}#t=0.1" muted playsinline preload="metadata"></video></div>`;
        fileCard.onclick = () => showPreview(file.name, `<video src="${file.url}" controls autoplay playsinline></video>`);
        videoList.appendChild(fileCard);
      } else if (previewSettings.audio.includes(ext)) {
        thumbnailHtml = `<div class="thumbnail audio-thumb"><span class="icon">🎵</span></div>`;
        fileCard.onclick = () => showPreview(file.name, `<audio src="${file.url}" controls autoplay></audio>`);
        audioList.appendChild(fileCard);
      } else if (previewSettings.image.includes(ext)) {
        thumbnailHtml = `<div class="thumbnail"><img src="${file.url}" alt="${file.name}" /></div>`;
        fileCard.onclick = () => showPreview(file.name, `<img src="${file.url}" alt="${file.name}" />`);
        imageList.appendChild(fileCard);
      } else {
        thumbnailHtml = `<div class="thumbnail other-thumb"><span class="icon">📁</span></div>`;
        fileCard.onclick = () => {
          if (confirm("이 파일은 미리보기를 지원하지 않습니다. 다운로드하시겠습니까?")) {
            window.location.href = file.url;
          }
        };
        otherList.appendChild(fileCard);
      }

      fileCard.innerHTML += `
        <div class="file-info">
          <span class="file-name" title="${file.name}">${file.name}</span>
          <div class="file-meta">
            <span class="file-size">${formatBytes(file.size)}</span>
            <span class="file-date">${formatDate(file.mtime)}</span>
          </div>
        </div>
        <div class="actions">
          <button class="delete-btn" onclick="deleteFile('${file.name}', event)">삭제</button>
          <a class="download-btn" href="${file.url}" download onclick="handleDownload(event)">다운로드</a>
        </div>
      `;
    });
  }

  loadFiles();
});
