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

    const fileList = files.map((file) => ({
      name: file,
      url: `/uploads/${file}`,
      extension: path.extname(file).toLowerCase(),
    }));
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
