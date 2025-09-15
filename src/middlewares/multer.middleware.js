import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp"); // Specify the directory to save uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date(Date.now().toLocaleString()).replaceAll(" ", "_") + "-" + file.originalname.replaceAll(" ", "_")); // Specify the filename
  },
});

const upload = multer({ storage: storage });

export default upload;

