import Swal from 'sweetalert2';

// Configure SweetAlert to use Tailwind classes for buttons so they are always visible
const customSwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 mx-1.5 inline-block',
    cancelButton: 'bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 mx-1.5 inline-block',
  },
  buttonsStyling: false
});

export const showAlert = (title, text, icon = 'info') => {
  return customSwal.fire({
    title,
    text,
    icon
  });
};

export const showLoader = (title = 'Please wait...', text = 'Processing your request') => {
  customSwal.fire({
    title,
    text,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

export const closeLoader = () => {
  customSwal.close();
};

export const showConfirm = async (title, text, confirmText = 'Yes, do it!') => {
  const result = await customSwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel'
  });
  return result.isConfirmed;
};

export default customSwal;
