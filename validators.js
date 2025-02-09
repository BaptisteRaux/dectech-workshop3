const { body, param, query, validationResult } = require('express-validator');

const productValidators = {
    create: [
        body('name').notEmpty().trim().withMessage('Le nom est requis'),
        body('price').isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
        body('stock').isInt({ min: 0 }).withMessage('Le stock doit être positif'),
        body('category').notEmpty().trim().withMessage('La catégorie est requise'),
        body('description').optional().trim()
    ],
    update: [
        param('id').notEmpty().withMessage('ID requis'),
        body('price').optional().isFloat({ min: 0 }),
        body('stock').optional().isInt({ min: 0 })
    ],
    getById: [
        param('id').notEmpty().withMessage('ID requis')
    ]
};

const cartValidators = {
    addItem: [
        param('userId').notEmpty().withMessage('UserID requis'),
        body('productId').notEmpty().withMessage('ProductID requis'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantité doit être positive')
    ],
    getCart: [
        param('userId').notEmpty().withMessage('UserID requis')
    ]
};

const orderValidators = {
    create: [
        body('userId').notEmpty().withMessage('UserID requis'),
        body('items').isArray().withMessage('Items doit être un tableau'),
        body('items.*.productId').notEmpty().withMessage('ProductID requis pour chaque item'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantité doit être positive')
    ]
};

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    productValidators,
    cartValidators,
    orderValidators,
    validate
};