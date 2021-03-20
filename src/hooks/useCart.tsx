import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const isProductInCart = cart.find(product => product.id === productId);
      
      const stockData = await api.get(`stock/${productId}`);
      const stock = stockData.data;
      if(isProductInCart){
        if(isProductInCart.amount + 1 > stock.amount){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        const newCart = cart.map((product) => {
          if(product.id === productId){
            return({...product,amount:product.amount+1});
          }else{
            return product;
          }
        })
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      }else{
          const newProductData = await api.get(`products/${productId}`);
          if(newProductData.data){
            const newProduct: Product = {
              ...newProductData.data,
              amount: 1
            }
            const newCart: Product[] = [
              ...cart,
              newProduct
            ]
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
            setCart(newCart);
        }else{
          throw new Error()
        }
      }

     } catch {
      toast.error('Erro na adição do produto');
     }
  };

  const removeProduct = (productId: number) => {
    try {
      const isProductInCart = cart.find(product => product.id === productId);
      if(isProductInCart){
        const newCart = cart.filter(product => product.id !== productId);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      }else{
        throw new Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const isProductInCart = cart.find(product => product.id === productId);
      if(isProductInCart){
        const stockData = await api.get(`stock/${productId}`);
        const stock = stockData.data;
        if(amount === 0 || amount > stock.amount){
          toast.error('Quantidade solicitada fora de estoque')
          return;
        }
        const newCart = cart.map((product) => {
          if(product.id === productId){
              return({...product,amount});
          }else{
            return product;
          }
        })
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      }else{
        throw new Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
