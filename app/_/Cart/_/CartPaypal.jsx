import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
// https://www.youtube.com/watch?v=AGDaLOawJSc&ab_channel=PayPalDeveloper

export default function CartPaypal({connected}) {
    return <div className={'paypalHold' + (!connected && " off")} title={"" + (!connected && "Veuillez-vous connecter pour pouvoir passer commande")}>
        <PayPalScriptProvider>
            <PayPalButtons aria-label='BUY WITH PAYPAL' createOrder={(data, actions) => {
                return actions.order.create({
                    purchase_units: [
                        {
                            amount: {
                                value: "100",
                            },
                        },
                    ],
                });
            }}>

            </PayPalButtons>
        </PayPalScriptProvider>
    </div>
}
