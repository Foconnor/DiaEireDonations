import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.PAYPAL_ENV === 'live' ? "http://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function generateAccessToken () {
    const clientId = process.env.PAYPAL_CLIENT_ID!;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        cache: "no-store",
    });

    if(!res.ok){
        const err = await res.text();
        throw new Error(`Paypal token error: ${res.status} ${err}`);
    }
    const data = (await res.json()) as {access_token: string};
    return data.access_token;
}

export async function POST(req: NextRequest) {
    try {
        const {orderId} = await req.json();
        if(!orderId){
            return NextResponse.json(
                {error: "Order ID is required"},
                {status: 400}
            );
        }

        const token = await generateAccessToken();

        const captureRes = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if(!captureRes.ok){
            const err = await captureRes.text();
            throw new Error(`Paypal capture error: ${captureRes.status} ${err}`);
        }
       
        const data = await captureRes.json();
        return NextResponse.json(data);

    } catch (error) {
        console.log(error);
        
        return NextResponse.json({error: "Failed to capture PayPal order"}, 
            {status: 500}
        );
    }
}