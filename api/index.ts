import express from 'express';
import bodyParser from 'body-parser';
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import twilio from "twilio";

require("dotenv").config();
const app = express();
app.use(bodyParser.json()); 



const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


(async () => {
    const app = express();
    // Parse URL-encoded bodies (as sent by HTML forms)
    app.use(bodyParser.urlencoded({ extended: true }));

    // Parse JSON bodies (as sent by API clients)
    app.use(bodyParser.json());

    app.post("/api/send-whatsapp", async (req, res) => {
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);
        const from = req.body.From;  // The sender's phone number
        const body = req.body.Body;
        console.log("Received WhatsApp message from", from, "with body:", body);

        try {
            const result = await generateText({
                model: openai("gpt-4o-mini"),
                maxSteps: 10,
                prompt: body,
            });

            console.log("AI response:", result.text);

            const message = await twilioClient.messages.create({
                to: `${from}`,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                body: result.text
            });
            res.json({ success: true, message: "WhatsApp message sent with AI response.", sid: message.sid });
        } catch (error) {
            const message = await twilioClient.messages.create({
                to: `${from}`,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                body: "Sorry, Currenlty I am not able to process your request. Please try again later."
            });

            console.error("Failed to send WhatsApp message with AI response:", error);
            res.status(500).json({ success: false, message: "Failed to send WhatsApp message." });
        }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    module.exports = app;
})();
