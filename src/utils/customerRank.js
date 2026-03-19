const getCustomerRankInfo = (totalSpending) => {
    if (totalSpending >= 150000000) {
        return { 
            name: 'Bạch Kim', 
            color: '#7c3aed', 
            icon: 'fa-crown', 
            discountRate: 10 
        };
    }
    if (totalSpending >= 50000000) {
        return { 
            name: 'Vàng', 
            color: '#d97706', 
            icon: 'fa-award', 
            discountRate: 5 
        };
    }
    if (totalSpending >= 20000000) {
        return { 
            name: 'Bạc', 
            color: '#4b5563', 
            icon: 'fa-medal', 
            discountRate: 2 
        };
    }
    return { 
        name: 'Thành viên', 
        color: '#64748b', 
        icon: 'fa-user', 
        discountRate: 0 
    };
};

module.exports = { getCustomerRankInfo };
