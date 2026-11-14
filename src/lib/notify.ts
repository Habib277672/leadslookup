import toast from "react-hot-toast";

/**
 * The only place the app talks to the toast library.
 * Using the message as the id replaces a repeated identical toast instead of stacking it.
 */
export const notify = {
  success(message: string) {
    toast.success(message, { id: message });
  },
  error(message: string) {
    toast.error(message, {
      id: message,
      // Visual echo only: the inline role="alert" message is the accessible one.
      ariaProps: { role: "status", "aria-live": "off" },
    });
  },
};
