// src/components/common/Button/Button.tsx
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = React.memo(({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const buttonClassName = `
    ${styles.button}
    ${styles[variant]}
    ${styles[size]}
    ${fullWidth ? styles.fullWidth : ''}
    ${loading ? styles.loading : ''}
    ${className}
  `;

  return (
    <button
      className={buttonClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      <span className={styles.content}>{children}</span>
    </button>
  );
});

export default Button;
