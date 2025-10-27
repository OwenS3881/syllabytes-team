//Allows every component to make an alert

let alertFn;

export const CustomAlert = {
    setAlertFunction: (fn) => {
        alertFn = fn;
    },
    alert: (title, message, buttons) => {
        if (alertFn) {
            alertFn(title, message, buttons);
        } else {
            console.warn("CustomAlert not initialized");
        }
    },
};
