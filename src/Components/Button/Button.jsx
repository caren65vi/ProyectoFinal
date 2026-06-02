import './Button.css'

const Button = ({ children, className = '', onClick, startIcon, ...props }) => {
  return (
    <button className={`btn ${className}`} onClick={onClick} {...props}>
      {startIcon && <span className="btnIcon">{startIcon}</span>}
      {children}
    </button>
  )
}

export default Button
