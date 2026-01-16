import React from 'react';
import './Card.css';

const Card = ({ children, className = '', onClick, hover = false }) => {
    const cardClasses = `card ${hover ? 'card-hover' : ''} ${className}`;

    return (
        <div className={cardClasses} onClick={onClick}>
            {children}
        </div>
    );
};

export default Card;
