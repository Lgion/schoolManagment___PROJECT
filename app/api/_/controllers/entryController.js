const fs = require('fs')
    , path = require('path')
    , multer = require('../middlewares/multer')
    , mongoose = require('mongoose')
// , { connectToDatabase } = require("../mongodb")
// , connectToDatabase = require("../mongodb_")











exports.createEntry = async (req, res, next, Model) => {
    // let test = await connectToDatabase.connect();
    // console.log(test,"Pinged your deployment. You successfully connected to MongoDB!");
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // await connectToDatabase();
    console.log(req.body)
    console.log(typeof req.body)
    // console.log(typeof req.body[modelKey])

    delete req.body.modelKey
    delete req.body.timestamp
    console.log('oijiojiojoioijfdsoijfdoijfoijfdsoijfdsijfds')
    const entryObject = req.body
    console.log('2oijiojiojoioijfdsoijfdoijfoijfdsoijfdsijfds')
    // const entryObject = JSON.parse(req.body.entry)

    // console.log(model);

    // multer(req,res,next)



    console.log(entryObject);
    console.log(Model);
    console.log("lààà");





    mongoose.connect('mongodb+srv://archist:1&Bigcyri@cluster0.61na4.mongodb.net/?retryWrites=true&w=majority',
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    )
        .then(() => {
            console.log('Connexion à MongoDB réussie !')

            const entry = new Model({
                ...entryObject
                // , userId: req.auth.userId
                // , imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
            })
            console.log(entry);
            console.log('3oijiojiojoioijfdsoijfdoijfoijfdsoijfdsijfds')
            entry.save()

                .then(() => { res.status(201).json({ message: 'Objet enregistré !' }) })
                .catch(error => { res.status(400).json({ error, msg: "mon custome msg !!" }) })
            console.log('4oijiojiojoioijfdsoijfdoijfoijfdsoijfdsijfds')
        })
        .catch((e) => console.log(e, 'Connexion à MongoDB échouée !'))
}
exports.modifyEntry = (req, res, next, Model) => {

    console.log(req.query._id);
    delete req.body.modelKey
    delete req.body.timestamp
    const entryObject = req.body

    Model.findOneAndUpdate({ _id: req.query._id },{ ...entryObject })
        .then((resp) => {
            console.log("ok del");
            res.status(201).json({ message: 'Objet modifié!' ,resp})
        })
        .catch((error) => {
            console.log("hmm.. err");
            res.status(400).json({ error })
        })
}
exports.deleteEntry = async (req, res, next, Model) => {
    mongoose.connect('mongodb+srv://archist:1&Bigcyri@cluster0.61na4.mongodb.net/?retryWrites=true&w=majority',
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    )
        .then(() => {
            console.log(process.cwd());
            console.log(path.join(process.cwd(), "/public", req.query.src));
            fs.unlink(path.join(process.cwd(), "/public", req.query.src), (err) => {
                if (err) console.log(err);
                Model.deleteOne({ _id: req.query._id })
                    .then(() => {
                        console.log("eeeeeeeeeeeend ok");
                        res.status(200).json({ message: 'Objet supprimé !' })
                    })
                    .catch(error => {
                        console.log("eeeeeeeeeeeend not ok");
                        res.status(401).json({ error })
                    })
            })
        })
}