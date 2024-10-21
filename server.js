const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 서버 설정
const app = express();
const PORT = 80;

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 파일 저장 방식 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD 형식의 날짜
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8'); // 한글 파일명 처리
        cb(null, `${dateStr}-${originalName}`);
    }
});

const upload = multer({ storage: storage });

// 정적 파일 서빙
app.use(express.static('public'));

// 파일 업로드 엔드포인트
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        const uploadedFile = req.file;
        if (!uploadedFile) {
            return res.status(400).send('No file uploaded.');
        }

        // 서버에 업로드 완료 로그
        console.log(`File uploaded: ${uploadedFile.filename}`);

        res.send(`File uploaded: ${uploadedFile.filename}`);
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 파일 다운로드 엔드포인트
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    const utf8Filename = Buffer.from(filename, 'latin1').toString('utf8'); // 한글 파일명 처리

    // 다운로드 시 UTF-8로 파일명 설정
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(utf8Filename)}`);
    res.download(filePath, utf8Filename, (err) => {
        if (err) {
            if (res.headersSent) {
                console.error('Headers already sent. Error occurred during download:', err);
                return; // 이미 헤더가 전송된 경우 추가로 응답하지 않음
            }

            if (err.code === 'ECONNABORTED') {
                console.warn('Download aborted by client:', err);
            } else {
                console.error('Download Error:', err);
                res.status(500).send(`Error downloading file: ${filename}`);
            }
        }
    });
});


// 파일 삭제 엔드포인트
app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Delete Error:', err);
            return res.status(404).send(`File not found: ${filename}`);
        }
        res.sendStatus(200); // 성공적으로 삭제된 경우 200 응답
    });
});

// 업로드된 파일 목록 제공 엔드포인트
app.get('/uploads', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('ReadDir Error:', err);
            return res.status(500).json({ message: "Failed to list files" });
        }
        res.json(files);
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
});
