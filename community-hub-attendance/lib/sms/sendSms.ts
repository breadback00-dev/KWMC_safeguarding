import { twilio } from "../twilio/client";

export const sendSms = async (to: string, body: string) => {
    try {
        const message = await twilio.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });
        return { success: true, messageId: message.sid };
    } catch (error) {
        console.error("Error sending SMS:", error);
        return { success: false, error };
    }
};
