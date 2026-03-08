const mongoose = require('mongoose');

const uri = "mongodb+srv://archistphotos:pRO2kUJqMihKOTdX@cluster0.ocqa5pg.mongodb.net/test?retryWrites=true&w=majority";

async function run() {
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        const collection = db.collection('ai_eleves_ecole_st_martins');

        const romain = await collection.findOne({ _id: new mongoose.Types.ObjectId("68e5169211c616be5aba7322") });

        console.log("Full Document for Romain:");
        console.log(JSON.stringify(romain, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
