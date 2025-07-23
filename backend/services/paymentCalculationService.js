/**
 * Payment Calculation Service
 * Handles fee calculations for property registration based on Ethiopian land registry standards
 */

// Fee structure configuration for Ethiopian property registration
const FEE_STRUCTURE = {
  // Base registration fees by property type (in ETB)
  baseFees: {
    residential: {
      urban: 2500,
      rural: 1500,
    },
    commercial: {
      urban: 5000,
      rural: 3000,
    },
    industrial: {
      urban: 7500,
      rural: 4500,
    },
    agricultural: {
      urban: 1000,
      rural: 800,
    },
  },
  
  // Area-based multipliers (per square meter)
  areaMultipliers: {
    residential: {
      urban: 2.5,
      rural: 1.0,
    },
    commercial: {
      urban: 5.0,
      rural: 2.5,
    },
    industrial: {
      urban: 3.5,
      rural: 2.0,
    },
    agricultural: {
      urban: 0.5,
      rural: 0.3,
    },
  },
  
  // Processing fees - Fixed amount for property registration
  processingFee: 550, // Fixed fee between 500-600 ETB as requested
  
  // Tax rates (percentage)
  taxRates: {
    registration: 0.02, // 2% registration tax
    stamp: 0.005, // 0.5% stamp duty
  },
  
  // Location-based multipliers
  locationMultipliers: {
    'Addis Ababa': 1.5,
    'Dire Dawa': 1.3,
    'Bahir Dar': 1.2,
    'Hawassa': 1.2,
    'Mekelle': 1.1,
    'Adama': 1.1,
    'Jimma': 1.0,
    'Dessie': 1.0,
    'default': 1.0,
  },
  
  // Discount rates for special cases
  discounts: {
    firstTimeOwner: 0.1, // 10% discount for first-time property owners
    veteran: 0.15, // 15% discount for veterans
    disability: 0.2, // 20% discount for people with disabilities
    lowIncome: 0.25, // 25% discount for low-income applicants
  },
};

class PaymentCalculationService {
  /**
   * Calculate total registration fee for a property
   * @param {Object} property - Property object with type, area, location
   * @param {Object} user - User object for discount eligibility
   * @param {Object} options - Additional calculation options
   * @returns {Object} Fee breakdown and total
   */
  static calculateRegistrationFee(property, user = null, options = {}) {
    try {
      const { propertyType, area, location } = property;
      const { subCity } = location;
      
      // Determine if location is urban or rural (simplified logic)
      const isUrban = this.isUrbanLocation(subCity);
      const locationKey = isUrban ? 'urban' : 'rural';
      
      // SIMPLIFIED PAYMENT STRUCTURE: Fixed fee between 500-600 ETB
      // Use the fixed processing fee as the total amount
      const processingFee = FEE_STRUCTURE.processingFee;

      // No additional taxes or calculations - keep it simple
      const registrationTax = 0;
      const stampDuty = 0;
      const totalTax = 0;

      // Total is just the processing fee
      const totalBeforeDiscount = processingFee;

      // Apply discounts (optional)
      const discountAmount = this.calculateDiscounts(totalBeforeDiscount, user, options);

      // Final total
      const totalAmount = Math.max(0, totalBeforeDiscount - discountAmount);

      return {
        breakdown: {
          baseFee: 0, // Removed base fee
          areaFee: 0, // Removed area fee
          locationMultiplier: 1,
          subtotal: 0, // No subtotal since base fee is removed
          registrationTax,
          stampDuty,
          totalTax,
          processingFee,
          totalBeforeDiscount,
          discountAmount,
          totalAmount,
        },
        summary: {
          baseFee: 0, // Explicitly set to 0 to remove from display
          processingFee,
          taxAmount: totalTax,
          discountAmount,
          totalAmount,
        },
        currency: 'ETB',
        calculatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error calculating registration fee:', error);
      throw new Error('Failed to calculate registration fee');
    }
  }
  
  /**
   * Calculate transfer fee for property ownership transfer
   * @param {Object} property - Property object
   * @param {number} transferValue - Declared transfer value
   * @param {Object} options - Transfer options
   * @returns {Object} Transfer fee breakdown
   */
  static calculateTransferFee(property, transferValue, options = {}) {
    const transferTaxRate = 0.03; // 3% transfer tax
    const processingFee = 300; // Higher processing fee for transfers
    
    const transferTax = transferValue * transferTaxRate;
    const stampDuty = transferValue * FEE_STRUCTURE.taxRates.stamp;
    const totalAmount = transferTax + stampDuty + processingFee;
    
    return {
      breakdown: {
        transferValue,
        transferTax,
        stampDuty,
        processingFee,
        totalAmount,
      },
      summary: {
        baseFee: transferTax,
        processingFee,
        taxAmount: stampDuty,
        discountAmount: 0,
        totalAmount,
      },
      currency: 'ETB',
      calculatedAt: new Date(),
    };
  }
  
  /**
   * Determine if a location is urban or rural
   * @param {string} subCity - Sub-city name
   * @returns {boolean} True if urban, false if rural
   */
  static isUrbanLocation(subCity) {
    const urbanKeywords = ['city', 'town', 'urban', 'municipality', 'metro'];
    const ruralKeywords = ['rural', 'village', 'countryside', 'woreda'];
    
    const subCityLower = subCity.toLowerCase();
    
    // Check for explicit urban indicators
    if (urbanKeywords.some(keyword => subCityLower.includes(keyword))) {
      return true;
    }
    
    // Check for explicit rural indicators
    if (ruralKeywords.some(keyword => subCityLower.includes(keyword))) {
      return false;
    }
    
    // Default to urban for major cities/sub-cities
    const majorSubCities = [
      'bole', 'kirkos', 'arada', 'addis ketema', 'lideta', 'yeka',
      'nifas silk-lafto', 'kolfe keranio', 'gulele', 'akaky kaliti'
    ];
    
    return majorSubCities.some(city => subCityLower.includes(city.toLowerCase()));
  }
  
  /**
   * Get location multiplier based on city/region
   * @param {string} subCity - Sub-city name
   * @returns {number} Location multiplier
   */
  static getLocationMultiplier(subCity) {
    const subCityLower = subCity.toLowerCase();
    
    for (const [location, multiplier] of Object.entries(FEE_STRUCTURE.locationMultipliers)) {
      if (location !== 'default' && subCityLower.includes(location.toLowerCase())) {
        return multiplier;
      }
    }
    
    return FEE_STRUCTURE.locationMultipliers.default;
  }
  
  /**
   * Calculate applicable discounts
   * @param {number} amount - Amount before discount
   * @param {Object} user - User object
   * @param {Object} options - Discount options
   * @returns {number} Total discount amount
   */
  static calculateDiscounts(amount, user, options = {}) {
    let totalDiscountRate = 0;
    
    // Apply user-based discounts (these would be determined by additional user profile data)
    if (options.isFirstTimeOwner) {
      totalDiscountRate += FEE_STRUCTURE.discounts.firstTimeOwner;
    }
    
    if (options.isVeteran) {
      totalDiscountRate += FEE_STRUCTURE.discounts.veteran;
    }
    
    if (options.hasDisability) {
      totalDiscountRate += FEE_STRUCTURE.discounts.disability;
    }
    
    if (options.isLowIncome) {
      totalDiscountRate += FEE_STRUCTURE.discounts.lowIncome;
    }
    
    // Cap total discount at 50%
    totalDiscountRate = Math.min(totalDiscountRate, 0.5);
    
    return amount * totalDiscountRate;
  }
  
  /**
   * Get fee structure for display purposes
   * @returns {Object} Current fee structure
   */
  static getFeeStructure() {
    return { ...FEE_STRUCTURE };
  }
  
  /**
   * Validate calculation inputs
   * @param {Object} property - Property object
   * @returns {boolean} True if valid
   */
  static validateCalculationInputs(property) {
    const { propertyType, area, location } = property;
    
    if (!propertyType || !['residential', 'commercial', 'industrial', 'agricultural'].includes(propertyType)) {
      throw new Error('Invalid property type');
    }
    
    if (!area || area <= 0) {
      throw new Error('Invalid property area');
    }
    
    if (!location || !location.subCity) {
      throw new Error('Invalid property location');
    }
    
    return true;
  }
}

export default PaymentCalculationService;
