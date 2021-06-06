// const upload = require('../../../config/multer');

const multer = require('multer');
const path = require('path')
const sharp = require('sharp');
const fs = require('fs');
const Book = require('../../../model/book');


const storage = multer.diskStorage({
  destination: function (req, file, callBack) {
    callBack(null, 'public/uploads')
  },
  filename: function (req, file, callBack) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = '.jpg'
    callBack(null, req.body.bookName + '-' + uniqueSuffix + extension)
  },
});


const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callBack) {
    let ext = path.extname(file.originalname);

    if (!req.body.bookName)
      return callBack(new Error('Book Name required'));

    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg')
      return callBack(new Error('Only images are allowed'));

    return callBack(null, true);
  }
}).single('file-to-upload');




function sellerController() {
  return {
    uploadBook(req, res) {
      return res.render('sellers/uploadBook')
    },
    postUploadBook(req, res) {

      upload(req, res, async (err) => {
        if (err) {
          req.flash('error', err.message);
          return res.render('sellers/uploadBook');
        }
        else {

          const fileLocation = path.resolve(req.file.destination, 'images', req.file.filename);

          await sharp(req.file.path)
            .resize(240, 384)
            .jpeg({ quality: 90 })
            .toFile(
              fileLocation
            ).catch((err) => {
              console.log(err);
              req.flash('error', 'something went wrong');
              fs.unlinkSync(req.file.path);
              return res.render('sellers/uploadBook');
            });

          fs.unlinkSync(req.file.path);
          const { bookName, description, tags } = req.body;

          const book = new Book({
            name: bookName,
            description: description,
            image: 'public/uploads/images/' + req.file.filename,
            tags: tags.split(''),
            sellerId: req.user
          });


          book.save()
            .then(() => {
              return res.redirect('/');
            })
            .catch((err) => {
              req.flash('error', 'Something went Wrong')
              return res.render('sellers/uploadBook');
            });

        }
      });
    },
  };
}

module.exports = sellerController;