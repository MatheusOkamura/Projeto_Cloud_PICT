const Card = ({ children, className = '', hover = true }) => {
  return (
    <div 
      className={`card ${hover ? 'hover:shadow-2xl' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
