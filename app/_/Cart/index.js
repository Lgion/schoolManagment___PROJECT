import React from 'react'
// import { useSelector } from 'react-redux';
import CartTotal from './CartTotal';
import EmptyCart from './EmptyCart';
// import Cart from './Cart';
// import CartPageFaq from './CartPageFaq';
// import CartPageFooter from './CartPageFooter';
// import SPFooter from './SPFooter';
// import YouMayAlsoLike from './YouMayAlsoLike';
// import MobileNav from './MobileNav';

const CartHold = () => {
    // let cartItems = useSelector((state) => state.cart.items);
    let cartItems = []

    // let cartLen = cartItems.length
    // let cartLen = 3
    let cartLen = 2
    // let cartLen = 1

    const totalPrice = 120000
    // const totalPrice = cartItems.map(item => {
    //     return item.quantity * item.price;
    // }).reduce((totalPrice, singleItemPrice) => totalPrice + singleItemPrice, 0);


    return (
        <div>
            {/* <MobileNav /> */}
            {/*<p className=' font-bold text-2xl fof'>CART TOAL ${totalPrice} </p>*/}
            {cartLen === 0 ? <EmptyCart /> : <>
                <div className=' flex flex-row relative gap-40 urCartItem'>
                    <p className=' text-2xl'> Your Cart </p>
                    <p className=' font-semibold fof lin text-xl'> {cartLen} items </p>
                </div>




                <div className='chParent'>
                    {cartItems.map((item, key) => (

                        <div key={"cartItem_"+key} className=''>

                            {/* <Cart
                                key={item.id}
                                item={{
                                    id: item.id,
                                    title: item.name,
                                    quantity: item.quantity,
                                    total: item.totalPrice,
                                    price: item.price,
                                    image: item.picture,
                                    cartLength: cartItems.length,
                                }}
                            /> */}
                        </div>
                    ))}
                </div>

                <CartTotal totalPr={totalPrice} />


                {/* <p className=' alsoLikeText relative fof text-4xl italic mb-10'> YOU MAY ALSO LIKE </p> */}
                {/* <YouMayAlsoLike className="" /> */}
                {/* <CartPageFaq /> */}

                {/* <CartPageFooter /> */}
            </>}





        </div>
    )
}

export default CartHold