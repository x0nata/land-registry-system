import { useState, useEffect } from 'react';

const PasswordStrengthMeter = ({ password }) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    calculateStrength(password);
  }, [password]);

  const calculateStrength = (password) => {
    // If no password, strength is 0
    if (!password) {
      setStrength(0);
      setFeedback('');
      return;
    }

    let strengthScore = 0;
    let feedbackText = [];

    // Length check
    if (password.length >= 8) {
      strengthScore += 1;
    } else {
      feedbackText.push('Password should be at least 8 characters long');
    }

    // Uppercase letter check
    if (/[A-Z]/.test(password)) {
      strengthScore += 1;
    } else {
      feedbackText.push('Add an uppercase letter');
    }

    // Lowercase letter check
    if (/[a-z]/.test(password)) {
      strengthScore += 1;
    } else {
      feedbackText.push('Add a lowercase letter');
    }

    // Number check
    if (/[0-9]/.test(password)) {
      strengthScore += 1;
    } else {
      feedbackText.push('Add a number');
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
      strengthScore += 1;
    } else {
      feedbackText.push('Add a special character');
    }

    // Set strength and feedback
    setStrength(strengthScore);
    setFeedback(feedbackText.join(', '));
  };

  // Determine color and label based on strength
  const getStrengthColor = () => {
    switch (strength) {
      case 0:
        return 'bg-gray-200';
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getStrengthLabel = () => {
    switch (strength) {
      case 0:
        return '';
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Good';
      case 5:
        return 'Strong';
      default:
        return '';
    }
  };

  // If no password, don't show the meter
  if (!password) {
    return null;
  }

  return (
    <div className="mt-1">
      <div className="flex items-center space-x-1 mb-1">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className={`h-2 flex-1 rounded-sm ${
              index < strength ? getStrengthColor() : 'bg-gray-200'
            }`}
          ></div>
        ))}
      </div>
      <div className="flex justify-between text-xs">
        <span className={strength > 0 ? `text-${getStrengthColor().replace('bg-', '')}` : 'text-gray-500'}>
          {getStrengthLabel()}
        </span>
        {feedback && <span className="text-gray-500">{feedback}</span>}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
