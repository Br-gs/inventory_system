import { useEffect } from "react";

const sidebarOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
};

const sidebarStyle = {
    position: "fixed",
    top: 0,
    right: 0,
    width: "400px",
    maxWidth: "100%",
    height: "100%",
    backgroundColor: "#white",
    boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
    zIndex: 101,
    padding: "20px",
    overflowY: "auto",
};

const Sidebar = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handlekeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handlekeyDown);
        }
        return () => {
            window.removeEventListener("keydown", handlekeyDown);
        };
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;
    
    return (
        <>
 
            <div 
                style={{
                ...sidebarOverlayStyle,
                opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none',
                }}
                onClick={onClose}
            />

            <div 
                style={sidebarStyle}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                    <h2>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                        &times;
                    </button>
                </div>
                {children}
            </div>
    </>
  );
};

export default Sidebar;