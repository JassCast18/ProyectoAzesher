let salesDraft = null;

export const getSalesDraft = () => salesDraft;

export const saveSalesDraft = (draft) => {
    salesDraft = draft;
};

export const clearSalesDraft = () => {
    salesDraft = null;
};
