const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const keys = require('./keys.json');
const { DateTime } = require('luxon');

const app = express();
const port = 2902;
const ffmpegPath = __dirname + '/ffmpeg'
const voicesPath = '/shared/voices';
const speakers = ['Claribel Dervla', 'Daisy Studious', 'Gracie Wise', 'Tammie Ema', 'Alison Dietlinde', 'Ana Florence', 'Annmarie Nele', 'Asya Anara', 'Brenda Stern', 'Gitta Nikolina', 'Henriette Usha', 'Sofia Hellen', 'Tammy Grit', 'Tanja Adelina', 'Vjollca Johnnie', 'Andrew Chipper', 'Badr Odhiambo', 'Dionisio Schuyler', 'Royston Min', 'Viktor Eka', 'Abrahan Mack', 'Adde Michal', 'Baldur Sanjin', 'Craig Gutsy', 'Damien Black', 'Gilberto Mathias', 'Ilkin Urbano', 'Kazuhiko Atallah', 'Ludvig Milivoj', 'Suad Qasim', 'Torcull Diarmuid', 'Viktor Menelaos', 'Zacharie Aimilios', 'Nova Hogarth', 'Maja Ruoho', 'Uta Obando', 'Lidiya Szekeres', 'Chandra MacFarland', 'Szofi Granger', 'Camilla Holmström', 'Lilya Stainthorpe', 'Zofija Kendrick', 'Narelle Moon', 'Barbora MacLean', 'Alexandra Hisakawa', 'Alma María', 'Rosemary Okafor', 'Ige Behringer', 'Filip Traverse', 'Damjan Chapman', 'Wulf Carlevaro', 'Aaron Dreschner', 'Kumar Dahl', 'Eugenio Mataracı', 'Ferran Simen', 'Xavier Hayasaka', 'Luis Moray', 'Marcos Rudaski'];



setInterval(() => {
    deleteOldMp3Files('/shared/server/public')
}, 1000 * 60 * 60);

ffmpeg.setFfmpegPath(ffmpegPath);



// Middleware to parse JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Route to handle form submission
// Route for handling TTS requests
app.post('/use-model', (req, res) => {
    let { prompt, apiKey, forceDownload, speaker, language } = req.body;

    if (!authenticate(apiKey)) {
        res.status(200).json({ error: 'Invalid API key.' });
    }
    if (!prompt || prompt.trim() === '') {
        res.status(200).json({ error: 'Prompt is empty.' });
        return;
    }


    const user = keys.find(key => key.key === apiKey);
    if (user) {
        log(`${user.name} sent (text:  ${prompt}, voice: ${speaker})`);
    }

    const filename = `${speaker}_${uuid()}.wav`;

    const filePath = '/shared/server/public/' + filename;

    const cmd = `tts --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --text "${prompt}" \
    --out_path "${filePath}" \
    --speaker_idx "${speaker}" \
    --language_idx ${language || 'en'} \
    --use_cuda true`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            log(error);
            res.status(200).json({ error: `exec error` });
            return;
        }

        ffmpeg(filePath)
            .toFormat('mp3')
            .on('error', (err) => {
                log(err);
            })
            .on('end', () => {
                if (!forceDownload) {
                    res.status(200).json({ filename: filename + '.mp3' });
                    fs.unlinkSync(filePath);
                } else {

                    // res.download(filePath + '.mp3', filename + '.mp3', (err) => {
                    if (err) {
                        log(err);
                        fs.unlinkSync(filePath);
                        res.status(200).json({ error: `Error sending file` });
                    } else {
                        log('File sent successfully');
                        // Optionally, you can delete the file after sending
                        fs.unlinkSync(filePath);
                        fs.unlinkSync(filePath + '.mp3');
                    }
                }
            })
            .save(filePath + '.mp3');

    });
});


// Route for handling TTS requests
app.post('/use-voice', (req, res) => {
    let { prompt, apiKey, speaker, forceDownload, language } = req.body;

    if (!authenticate(apiKey)) {
        console.log('Invalid API key.')
        res.status(200).json({ error: 'Invalid API key.' });
        return;
    }
    if (!prompt || prompt.trim() === '') {
        console.log('Prompt is empty.')
        res.status(200).json({ error: 'Prompt is empty.' });
        return;
    }
    if (!speaker || speaker.trim() === '') {
        console.log('Speaker is empty.')
        res.status(200).json({ error: 'Speaker is empty.' });
        return;
    }

    const user = keys.find(key => key.key === apiKey);
    if (user) {
        log(`${user.name} sent (text:  ${prompt}, voice: ${speaker})`);
    }

    const filename = `${speaker}_${uuid()}.wav`;
    const filePath = '/shared/server/public/' + filename;
    const modelFile = `${voicesPath}/${speaker}.wav`;

    if (!fs.existsSync(modelFile)) {
        res.status(200).json({ error: 'Voice file not found.' });
        return;
    }
    // const cmd = `melo "${prompt}" ${filename} --language ${language || 'EN'} --speaker ${speaker || 'EN-BR'} --speed ${+speed || 0.8}`;

    const cmd = `tts --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --text "${prompt}" \
    --out_path "${filePath}" \
    --speaker_wav "${modelFile}" \
    --language_idx ${language || 'en'} \
    --use_cuda true`;

    log(cmd)
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            log(error);
            res.status(200).json({ error });
            return;
        }
        ffmpeg(filePath)
            .toFormat('mp3')
            .on('error', (err) => {
                log(err);
            })
            .on('end', () => {
                if (!forceDownload) {
                    res.status(200).json({ filename: filename + '.mp3' });
                    fs.unlinkSync(filePath);
                } else {
                    // Return the output.mp3 file as a download
                    res.download(filePath + '.mp3', filename + '.mp3', (err) => {
                        if (err) {
                            log(err);
                            fs.unlinkSync(filePath);
                            res.status(200).json({ error: `Error sending file` });
                        } else {
                            log('File sent successfully');
                            // Optionally, you can delete the file after sending
                            fs.unlinkSync(filePath);
                            fs.unlinkSync(filePath + '.mp3');
                        }
                    });
                }
            }).save(filePath + '.mp3');

    });
});


app.get('/list-models', (req, res) => {
    // get all the .wav files in the voices folder
    res.status(200).json({ speakers: speakers });
})


app.get('/list-voices', (req, res) => {
    const voices = fs.readdirSync(voicesPath);
    res.status(200).json({ speakers: voices.filter(v => v.includes('.wav')).map(v => v.split('.wav')[0]) });
})

app.get('/', (req, res) => {
    // send index.html
    res.sendFile('/shared/server/index.html');
})

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    log(`Server is running on http://localhost:${port}`);
});

function authenticate(apiKey) {
    if (!apiKey) return false;
    // get array of keys from keys.json
    // check if apiKey is valid
    for (const key of keys) {
        if (key.key === apiKey) {
            return true;
        }
    }
    return false;
}


function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function log(msg) {
    const today = DateTime.now().setZone("Africa/Lagos").toISODate();
    fs.appendFileSync(`/shared/logs/${today}.log`, `${new Date().toLocaleString()}: ${JSON.stringify(msg)}\n`);
}

async function deleteOldMp3Files(folderPath) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    try {
        const files = await fs.promises.readdir(folderPath);

        const deletePromises = files.map(async (file) => {
            const filePath = path.join(folderPath, file);
            const stats = await fs.promises.stat(filePath);

            if (path.extname(filePath).toLowerCase() === '.mp3' && (now - stats.mtimeMs) > oneHour) {
                await fs.promises.unlink(filePath);
                console.log(`Deleted: ${filePath}`);
            }
        });

        await Promise.all(deletePromises);
        console.log('Deletion process completed.');
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
}