import crypto from "node:crypto";
import mongoose from "mongoose";
import { AppError } from "./core.js";
import { Campaign, Donation, Payment, Receipt, User } from "./models.js";
import { paymentProvider } from "./payments.js";

export async function createDonation(userId:string, campaignId:string, amount:number, currency="INR") {
  const campaign = await Campaign.findOne({_id:campaignId,status:"ACTIVE"});
  if (!campaign) throw new AppError(409,"CAMPAIGN_UNAVAILABLE","This campaign is not accepting donations");
  if (!Number.isInteger(amount) || amount < 1 || amount > 1_000_000) throw new AppError(400,"INVALID_AMOUNT","Donation amount is invalid");
  const donation = await Donation.create({userId,campaignId,amount,currency,provider:process.env.PAYMENT_PROVIDER || "mock"});
  const order = await paymentProvider.createOrder(amount * 100,currency,donation.id);
  await Promise.all([Donation.updateOne({_id:donation.id, providerOrderId:{$exists:false}},{$set:{providerOrderId:order.orderId}}), Payment.create({donationId:donation.id,provider:donation.provider,providerOrderId:order.orderId,amount,currency})]);
  return { donationId:donation.id, orderId:order.orderId, amount:order.amount, currency:order.currency, keyId:order.keyId };
}

/** The conditional transition makes frontend retries and webhook duplication harmless. */
export async function settleDonation(orderId:string, paymentId:string, outcome:"CAPTURED"|"FAILED") {
  const session = await mongoose.startSession();
  try { let result: { donationId:string; status:string; receiptId?:string } | undefined;
    await session.withTransaction(async () => {
      const donation = await Donation.findOne({providerOrderId:orderId}).session(session);
      if (!donation) throw new AppError(404,"DONATION_NOT_FOUND","Donation was not found");
      if (donation.status === "SUCCESS") { result={donationId:donation.id,status:"SUCCESS",receiptId:donation.receiptId?.toString()}; return; }
      if (outcome === "FAILED") { await Promise.all([Donation.updateOne({_id:donation.id,status:{$in:["PENDING","PROCESSING"]}},{$set:{status:"FAILED",providerPaymentId:paymentId}},{session}), Payment.updateOne({donationId:donation.id},{$set:{status:"FAILED",providerPaymentId:paymentId}},{session})]); result={donationId:donation.id,status:"FAILED"}; return; }
      const transitioned = await Donation.findOneAndUpdate({_id:donation.id,status:{$in:["PENDING","PROCESSING"]}},{$set:{status:"SUCCESS",providerPaymentId:paymentId}},{new:true,session});
      if (!transitioned) { result={donationId:donation.id,status:donation.status}; return; }
      await Campaign.updateOne({_id:donation.campaignId},{$inc:{amountRaised:donation.amount}},{session});
      const receipt = await Receipt.findOneAndUpdate({donationId:donation.id},{$setOnInsert:{userId:donation.userId,campaignId:donation.campaignId,receiptNumber:`NN-${Date.now()}-${crypto.randomUUID().slice(0,8)}`,amount:donation.amount}},{upsert:true,new:true,session});
      await Promise.all([Donation.updateOne({_id:donation.id},{$set:{receiptId:receipt._id}},{session}),Payment.updateOne({donationId:donation.id},{$set:{status:"CAPTURED",providerPaymentId:paymentId,verifiedAt:new Date()}},{session})]);
      result={donationId:donation.id,status:"SUCCESS",receiptId:receipt.id};
    }); return result!;
  } finally { await session.endSession(); }
}

export async function issueTokens(user:{id:string;role:string}) { const jwt = await import("jsonwebtoken"); const {env}=await import("./config.js"); return {accessToken:jwt.default.sign({role:user.role},env.JWT_ACCESS_SECRET,{subject:user.id,expiresIn:"15m"}),refreshToken:jwt.default.sign({type:"refresh"},env.JWT_REFRESH_SECRET,{subject:user.id,expiresIn:"7d"})}; }
export { User };
