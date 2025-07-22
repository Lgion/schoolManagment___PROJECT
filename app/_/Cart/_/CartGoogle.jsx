import GooglePayButton from "@google-pay/button-react";

export default function CartGoogle({connected}) {
    return <div className='gpayBtnHold flex justify-center'>
        <GooglePayButton className='gpayHold' environment='TEST' paymentRequest={{
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [
                {
                    type: "CARD",
                    parameters: {
                        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                        allowedCardNetworks: ["MASTERCARD", "VISA", "AMEX"]
                    },

                    tokenizationSpecification: {
                        type: "PAYMENT_GATEWAY",
                        parameters: {
                            gateway: "example",
                            gatewayMerchantId: "exampleGatewayMerchantId",


                        },
                    },

                },
            ],
            merchantInfo: {
                merchantId: "17613812255336763067",
                merchantName: "Demo Only"
            },

            transactionInfo: {

                totalPriceStatus: 'FINAL',
                totalPriceLabel: "Total",
                totalPrice: "500",
                currencyCode: "USD",
                countryCode: "US",
            },
        }}
            onLoadPaymentData={paymentData => {
                console.log(paymentData.paymentMethodData);
            }}

        />
    </div>
}
