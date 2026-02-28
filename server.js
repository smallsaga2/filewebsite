const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 80;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 업로드 폴더 경로 설정
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// 접속 로그 미들웨어 (콘솔에 출력)
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const timestamp = new Date().toLocaleString();
  const path = req.path;

  // 모든 요청을 콘솔에 기록 (정적 파일 제외하고 싶으면 필터링 가능)
  if (path === '/' || path.startsWith('/api')) {
    console.log(`[${timestamp}] 접속: ${ip} | ${req.method} ${path} | ${userAgent}`);
  }

  // 업로드 진행률 로그 (업로드 API 호출 시)
  if (path === '/api/upload' && req.method === 'POST') {
    const totalSize = parseInt(req.headers['content-length'], 10);
    let uploadedSize = 0;
    let lastLoggedPercent = -1;

    console.log(`[${timestamp}] 업로드 시작: ${totalSize} bytes`);

    req.on('data', (chunk) => {
      uploadedSize += chunk.length;
      const progress = ((uploadedSize / totalSize) * 100);
      const currentPercent = Math.floor(progress);

      // 5% 단위로만 로그 출력하거나 실시간 한 줄 출력
      if (currentPercent % 5 === 0 && currentPercent !== lastLoggedPercent) {
        process.stdout.write(`\r업로드 진행 중: ${currentPercent}% (${uploadedSize}/${totalSize} bytes)`);
        lastLoggedPercent = currentPercent;
      }
    });

    req.on('end', () => {
      process.stdout.write(`\r업로드 완료: 100% (${totalSize}/${totalSize} bytes)\n`);
    });
  }
  
  next();
});

// 파일 업로드를 처리하는 multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

// 정적 경로 설정
app.use("/uploads", express.static(uploadFolder));
app.use(express.static(path.join(__dirname, "public")));

// 파일 업로드 API
app.post("/api/upload", upload.array("file"), (req, res) => {
  if (req.files && req.files.length > 0) {
    res.status(200).json({ message: "파일 업로드 성공" });
  } else {
    res.status(400).json({ message: "파일 업로드 실패" });
  }
});

// 파일 목록 반환 API
app.get("/api/files", (req, res) => {
  fs.readdir(uploadFolder, (err, files) => {
    if (err) {
      return res.status(500).json({ message: "파일 목록을 불러올 수 없습니다." });
    }

    const fileList = files.map((file) => {
      const filePath = path.join(uploadFolder, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        url: `/uploads/${file}`,
        extension: path.extname(file).toLowerCase(),
        size: stats.size,
        mtime: stats.mtime
      };
    });
    res.json(fileList);
  });
});

// 파일 삭제 API
app.delete("/api/files/:name", (req, res) => {
  const fileName = req.params.name;
  const filePath = path.join(uploadFolder, fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ message: "파일 삭제 실패" });
    }
    res.status(200).json({ message: "파일 삭제 성공" });
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
