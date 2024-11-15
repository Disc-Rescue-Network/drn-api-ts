import twilio from "twilio";
import vCards from "vcards-js";

import config from '../../config'

const twilioClient = twilio(config.twilioSID, config.twilioAuthToken);

/**
 * send a new text (sms) through twilio
 *
 * @param {string} toPhoneNumber phone number to send to
 * @param {string} messageBody text message to send
 * @returns
 */
export const sendSms = async (
  toPhoneNumber: string,
  messageBody: string
): Promise<void | { errors: object[] }> => {
  try {
    const messageInstance = await twilioClient.messages.create({
      body: messageBody,
      from: config.twilioSendFrom,
      to: toPhoneNumber,
      // shortenUrls: true,
      messagingServiceSid: config.twilioMessagingSID,
    });
    console.log(`messageInstance: ${JSON.stringify(messageInstance)}`);
    if (messageInstance.errorCode !== null) {
      return { errors: [] };
    }
  } catch (e) {
    console.error(e, "twilio sendsms err");
    return { errors: [] };
  }
};

/**
 * Send drn vcard through twilio
 *
 * @param {string} toPhoneNumber phone number to send to
 * @param {string} messageBody text message to send with the vcard
 * @returns `undefined`
 */
export const sendVCard = async (
    toPhoneNumber: string,
    messageBody: string
) => {
    try {
        const messageInstance = await twilioClient.messages.create({
            body: messageBody,
            from: config.twilioSendFrom,
            to: toPhoneNumber,
            mediaUrl: [
                config.twilio_vcf_url,
            ],
        });

        console.log('Message Instance', messageInstance);
    } catch (e) {
        console.error('Error sending vcard', e);
    }
};
