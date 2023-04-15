const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');
const express = require("express");
const OPENAI_API_KEY = "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";
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());

app.use(express.json());

app.get("/ping", (req, res) => {
  res.json({
    message: "pong",
  });
});


app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});


const form = new FormData();
form.append('image', fs.createReadStream('image.jpg'));

const headers = form.getHeaders();
headers['Authorization'] = 'Bearer 9191a865f873dda49b20560c8c3cb3247cfa29c8';

const options = {
  hostname: 'api.logmeal.es',
  path: '/v2/recognition/dish',
  method: 'POST',
  headers: headers,
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', async () => {
    const response = JSON.parse(data);
    const recognitionResults = response.recognition_results;
    if (recognitionResults.length > 0) {
      const topResult = recognitionResults[0];
      const id = topResult.id;
      const name = topResult.name;
      const subclasses = topResult.subclasses;
      console.log('Top Dish:', id, name, subclasses);

     
      app.post("/chat", (req, res) => {
        const question = `Write recipe of ${name}`;
      
        openai
          .createCompletion({
            model: "text-davinci-003",
            prompt: question,
            max_tokens: 2048,
            temperature: 0,
          })
          .then((response) => {
            console.log({ response });
            return response?.data?.choices?.[0]?.text;
          })
          .then((answer) => {
            console.log({ answer });
            const array = answer
              ?.split("\n")
              .filter((value) => value)
              .map((value) => value.trim());
      
            return array;
          })
          .then((answer) => {
            res.json({
              answer: answer,
              propt: question,
            });
          });
        console.log({ question });
      });
    }
  });
});

form.pipe(req);
