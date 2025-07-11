import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SmartRegisterButton = ({ 
  children, 
  className = '', 
  authenticatedText = 'Register Property',
  unauthenticatedText = 'Register Now',
  ...props 
}) => {
  const { isAuthenticated } = useAuth();

  // Determine the destination and text based on authentication status
  const destination = isAuthenticated() ? '/property/register' : '/register';
  const buttonText = children || (isAuthenticated() ? authenticatedText : unauthenticatedText);

  return (
    <Link
      to={destination}
      className={className}
      {...props}
    >
      {buttonText}
    </Link>
  );
};

export default SmartRegisterButton;
