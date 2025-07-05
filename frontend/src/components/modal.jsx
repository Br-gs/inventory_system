const Modal = ({ isOpen, onClose, children }) => {

  if (!isOpen) {
    return null;
  }

  return (
    <div onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal;