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
  //왜 있는지 모르겠음 암튼 삭제 기능능
  const deleteModal = document.getElementById("deleteModal");
  const confirmDelete = document.getElementById("confirmDelete");
  const cancelDelete = document.getElementById("cancelDelete");
  //파일 업로드 프로그래스 바
  const uploadProgressContainer = document.getElementById("uploadProgressContainer");
  const uploadProgressBar = document.getElementById("uploadProgressBar");
  //알림 컨테이너
  const notificationContainer = document.getElementById("notificationContainer");

  let fileToDelete = ""; // 삭제할 파일 이름을 저장

// 파일 유형별 미리보기 렌더링 설정
const previewSettings = {
  video: [".mp4", ".mov", ".avi"], // 동영상 확장자
  audio: [".mp3", ".wav", ".ogg"], // 오디오 확장자
  image: [".jpg", ".png", ".jpeg", ".gif", ".bmp"], // 이미지 확장자
};


    // 알람 생성 함수
    function showNotification(message) {
      const notification = document.createElement("div");
      notification.classList.add("notification");
      notification.textContent = message;
  
      notificationContainer.appendChild(notification);
  
      // 1초 후 알람 숨기기
      setTimeout(() => {
        notification.classList.add("hidden");
        setTimeout(() => notification.remove(), 1000); // 애니메이션 이후 알림 제거
      }, 2000);
    }
  
// 썸네일 미리보기를 처리하는 함수
function createThumbnail(file) {
  const fileItem = document.createElement("div");
  fileItem.classList.add("file-item");

  // 확장자에 따라 파일 유형을 결정
  const ext = file.extension.toLowerCase();
  if (previewSettings.video.includes(ext)) {
    fileItem.innerHTML = `<video src="${file.url}" muted></video>`;
    fileItem.onclick = () =>
      showPreview(file.name, `<video src="${file.url}" controls autoplay></video>`);
  } else if (previewSettings.audio.includes(ext)) {
    fileItem.innerHTML = `<audio src="${file.url}" controls></audio>`;
    fileItem.onclick = () =>
      showPreview(file.name, `<audio src="${file.url}" controls autoplay></audio>`);
  } else if (previewSettings.image.includes(ext)) {
    fileItem.innerHTML = `<img src="${file.url}" alt="${file.name}" />`;
    fileItem.onclick = () =>
      showPreview(file.name, `<img src="${file.url}" alt="${file.name}" />`);
  } else {
    // 기타 파일  
    fileItem.innerHTML = `<span>${file.name}</span>`;
  }

  return fileItem;
}

// 썸네일 클릭 시 팝업 표시
function showPreview(fileName, content) {
  const previewPopup = document.getElementById("previewPopup");
  const popupMedia = document.getElementById("popupMedia");
  document.getElementById("popupFileName").textContent = fileName;
  popupMedia.innerHTML = content;
  previewPopup.classList.remove("hidden");
  previewPopup.classList.add("visible");

  closePopup.addEventListener("click", () => {
    const mediaElement = popupMedia.querySelector("video, audio");
    if (mediaElement) {
      mediaElement.pause(); // 미디어 재생 중지
      mediaElement.currentTime = 0; // 미디어 재생 위치 초기화
    }
    previewPopup.classList.add("hidden");
    previewPopup.classList.remove("visible");
  });
}

    // 파일 삭제 함수
    window.deleteFile = async (fileName, event) => {
      // 이벤트 버블링 차단(썸네일 클릭 이벤트 중단)
      event.stopPropagation();
    
      try {
        const response = await fetch(`/api/files/${fileName}`, { method: "DELETE" });
    
        if (response.ok) {
          showNotification("파일 삭제 성공!");
          loadFiles(); // 파일 목록 새로고침
        } else {
          throw new Error("파일 삭제 실패");
        }
      } catch (err) {
        showNotification("파일 삭제 실패!");
        console.error(err);
      }
    };
    
    // 다운로드 함수
    function handleDownload(event) {
      event.stopPropagation();
    }
  
    function showProgressBar() {
      uploadProgressContainer.classList.remove("hidden");
      uploadProgressBar.style.width = "0%";
    }
  
    // 로드 바 숨기기 함수
    function hideProgressBar() {
      setTimeout(() => {
        uploadProgressContainer.classList.add("hidden");
      }, 500); // 로드 바를 조금 뒤에 숨김
    }
  
    // 파일 업로드 함수
    async function uploadFiles(files) {
      const formData = new FormData();
      for (const file of files) {
        formData.append("file", file);
      }
  
      try {
        showProgressBar(); // 프로그래스 바 표시
  
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload", true);
  
        // 업로드 진행률 이벤트
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            uploadProgressBar.style.width = `${percentComplete}%`; // 진행률 업데이트
          }
        };
  
        // 업로드 완료 처리
        xhr.onload = () => {
          if (xhr.status === 200) {
            showNotification("파일 업로드 성공!");
            loadFiles(); // 업로드 후 파일 목록 새로고침
          } else {
            showNotification("파일 업로드 실패!");
          }
          hideProgressBar(); // 프로그래스 바 숨김
        };
  
        // 업로드 실패 처리
        xhr.onerror = () => {
          showNotification("파일 업로드 실패!");
          hideProgressBar(); // 프로그래스 바 숨김
        };
  
        xhr.send(formData);
      } catch (err) {
        console.error("업로드 중 오류:", err);
      }
    }
  
    // 드래그 앤 드롭 관련 이벤트
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
  
      // 드래그된 파일 업로드
      const files = e.dataTransfer.files;
      uploadFiles(files);
    });
  
    // 클릭 통한 파일 업로드
    dropZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => uploadFiles(e.target.files));
  
    // 파일 목록 로드 함수
    async function loadFiles() {
      try {
        const response = await fetch("/api/files");
        const files = await response.json();
    
        const videoList = document.getElementById("videoList");
        const audioList = document.getElementById("audioList");
        const imageList = document.getElementById("imageList");
        const otherList = document.getElementById("otherList");
    
        // 기존 목록 초기화
        videoList.innerHTML = "";
        audioList.innerHTML = "";
        imageList.innerHTML = "";
        otherList.innerHTML = "";
    
        // 파일 목록 순회
        files.forEach((file) => {
          const fileItem = document.createElement("div");
          fileItem.classList.add("file-item");
    
          // 파일 유형에 맞게 썸네일 생성
          const ext = file.extension.toLowerCase();
          if (previewSettings.video.includes(ext)) {
            fileItem.innerHTML = `<video src="${file.url}" muted></video>`;
            fileItem.onclick = () =>
              showPreview(file.name, `<video src="${file.url}" controls autoplay></video>`);
            videoList.appendChild(fileItem);
          } else if (previewSettings.audio.includes(ext)) {
            fileItem.innerHTML = `<audio src="${file.url}" controls></audio>`;
            fileItem.onclick = () =>
              showPreview(file.name, `<audio src="${file.url}" controls autoplay></audio>`);
            audioList.appendChild(fileItem);
          } else if (previewSettings.image.includes(ext)) {
            fileItem.innerHTML = `<img src="${file.url}" alt="${file.name}" />`;
            fileItem.onclick = () =>
              showPreview(file.name, `<img src="${file.url}" alt="${file.name}" />`);
            imageList.appendChild(fileItem);
          } else {
            fileItem.innerHTML = `<span>${file.name}</span>`;
            otherList.appendChild(fileItem);
          }
    
          // 삭제 및 다운로드 버튼 추가
          const actions = document.createElement("div");
          actions.classList.add("actions");
          actions.innerHTML = `
            <button class="delete-btn" onclick="deleteFile('${file.name}', event)">삭제</button>
            <a class="download-btn" href="${file.url}" download onclick="handleDownload(event)">다운로드</a>
          `;
          fileItem.appendChild(actions);
        });
      } catch (err) {
        console.error("파일 목록 로드 실패:", err);
      }
    }
  
  // 초기 파일 목록 로드
  loadFiles();
});