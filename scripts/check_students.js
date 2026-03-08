const mongoose = require('mongoose');

const uri = "mongodb+srv://archistphotos:pRO2kUJqMihKOTdX@cluster0.ocqa5pg.mongodb.net/test?retryWrites=true&w=majority";

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        // We don't need the full schema, just find documents in the raw collection
        const db = mongoose.connection.db;
        const collection = db.collection('ai_eleves_ecole_st_martins');

        const students = await collection.find({ nom: "Hien" }).toArray();

        console.log(`Found ${students.length} students with nom "Hien":`);
        students.forEach((s, i) => {
            console.log(`--- Student ${i + 1} ---`);
            console.log(`ID: ${s._id}`);
            console.log(`Prenoms: ${JSON.stringify(s.prenoms)}`);
            console.log(`Compositions: ${JSON.stringify(s.compositions)}`);
            console.log(`------------------------`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
