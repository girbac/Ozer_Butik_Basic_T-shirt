/*
 * iyzipay paketi TypeScript tipleriyle gelmiyor. Burada yalnızca kullandığımız
 * yüzeyi tanımlıyoruz — tamamını değil.
 */
declare module "iyzipay" {
  export type IyzipayCallback<T> = (error: Error | null, result: T) => void;

  export type CheckoutFormInitializeRequest = {
    locale: string;
    conversationId: string;
    price: string;
    paidPrice: string;
    currency: string;
    basketId: string;
    paymentGroup: string;
    callbackUrl: string;
    enabledInstallments?: number[];
    buyer: {
      id: string;
      name: string;
      surname: string;
      gsmNumber: string;
      email: string;
      identityNumber: string;
      registrationAddress: string;
      ip: string;
      city: string;
      country: string;
      zipCode?: string;
    };
    shippingAddress: {
      contactName: string;
      city: string;
      country: string;
      address: string;
      zipCode?: string;
    };
    billingAddress: {
      contactName: string;
      city: string;
      country: string;
      address: string;
      zipCode?: string;
    };
    basketItems: {
      id: string;
      name: string;
      category1: string;
      itemType: string;
      price: string;
    }[];
  };

  export type CheckoutFormInitializeResult = {
    status: "success" | "failure";
    errorCode?: string;
    errorMessage?: string;
    locale?: string;
    conversationId?: string;
    token?: string;
    signature?: string;
    checkoutFormContent?: string;
    paymentPageUrl?: string;
  };

  export type CheckoutFormRetrieveResult = {
    status: "success" | "failure";
    errorCode?: string;
    errorMessage?: string;
    /** SUCCESS | FAILURE | INIT_THREEDS | CALLBACK_THREEDS | BKM_POS_SELECTED */
    paymentStatus?: string;
    paymentId?: string;
    currency?: string;
    basketId?: string;
    conversationId?: string;
    paidPrice?: string;
    price?: string;
    token?: string;
    signature?: string;
    fraudStatus?: number;
  };

  export default class Iyzipay {
    constructor(config: { apiKey: string; secretKey: string; uri: string });

    static LOCALE: { TR: string; EN: string };
    static CURRENCY: { TRY: string; EUR: string; USD: string; GBP: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };

    checkoutFormInitialize: {
      create(
        request: CheckoutFormInitializeRequest,
        callback: IyzipayCallback<CheckoutFormInitializeResult>,
      ): void;
    };

    checkoutForm: {
      retrieve(
        request: { locale: string; conversationId?: string; token: string },
        callback: IyzipayCallback<CheckoutFormRetrieveResult>,
      ): void;
    };
  }
}
