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
 * send drn vcard through twilio
 *
 * @param {string} toPhoneNumber phone number to send to
 * @param {string} messageBody text message to send with the vcard
 * @returns `undefined` if succesful, else error `object`
 */
export const sendVCard = async (
  toPhoneNumber: string,
  messageBody: string
): Promise<void | { errors: object[] }> => {
  try {
    const messageInstance = await twilioClient.messages.create({
      body: messageBody,
      from: config.twilioSendFrom,
      to: toPhoneNumber,
      mediaUrl: [
        "https://drn-api-v2.discrescuenetwork.com/phone-opt-ins/twilio/vcf",
      ],
    });
    console.log("messageInstance", messageInstance);
  } catch (e) {
    console.error(e, "twilio sendsms err");
    return { errors: [] };
  }
};
