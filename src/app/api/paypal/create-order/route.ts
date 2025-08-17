import {NextResponse, NextRequest} from 'next/server';

const BASE_URL = process.env.PAYPAL_ENV === 'live' ? "http://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";


async function generateAccessToken() {
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

export async function POST(req: NextRequest){
    try {
        const {amount, currency = "EUR"} = await req.json();
        if(!amount){
            return NextResponse.json(
                {error: "Amount is required"},
                {status: 400}
            );
        }

        const token = await generateAccessToken();

        const orderRes = await fetch(`${BASE_URL}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: {
                            currency_code: currency,
                            value: `${amount}`,
                        },
                    },
                ],
            }),
        });

        if(!orderRes.ok){
            const err = await orderRes.text();
            throw new Error(`Paypal order error: ${orderRes.status} ${err}`);
        }

        const order = await orderRes.json();
        return NextResponse.json(order);
    } catch (err) {
        console.log('error while paypal payment token',err);
        return NextResponse.json(
            {error: "Failed to created paypal order"},
            {status: 500}
        );
    }
}