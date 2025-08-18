"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";

type Props = {
    amount: string,
    currency: string,
}

export default function PayPalCheckout({amount, currency = "EUR"}: Props){
    
}