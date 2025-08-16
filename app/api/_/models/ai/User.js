const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = mongoose.Schema({
    clerkId: { type: String, required: true, unique: true }, // ID Clerk pour liaison
    email: { type: String, required: true, unique: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    role: { 
        type: String, 
        enum: ['admin', 'prof', 'eleve', 'public'], 
        default: 'public',
        required: true 
    },
    
    // Métadonnées de connexion
    lastLogin: { type: Date, default: Date.now },
    loginCount: { type: Number, default: 1 },
    
    // Préférences utilisateur (pour localStorage)
    preferences: {
        theme: { type: String, default: 'light' },
        language: { type: String, default: 'fr' },
        notifications: { type: Boolean, default: true }
    },
    
    // Données spécifiques selon le rôle
    roleData: {
        // Pour les admins
        adminLevel: { type: String, enum: ['super', 'standard'], default: 'standard' },
        
        // Pour les profs - référence vers Teacher
        teacherRef: { type: Schema.Types.ObjectId, ref: 'ai_Profs_Ecole_St_Martin' },
        
        // Pour les élèves - référence vers Eleve  
        eleveRef: { type: Schema.Types.ObjectId, ref: 'ai_Eleves_Ecole_St_Martin' },
        
        // Pour les publics - informations de contact
        contactInfo: {
            phone: { type: String, default: "" },
            address: { type: String, default: "" }
        }
    },
    
    // Permissions spécifiques (pour cas particuliers)
    customPermissions: {
        canViewReports: { type: Boolean, default: false },
        canManageDocuments: { type: Boolean, default: false },
        canContactTeachers: { type: Boolean, default: false }
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

// Middleware pour mettre à jour updatedAt
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Méthodes du schéma
userSchema.methods.updateLoginInfo = function() {
    this.lastLogin = Date.now();
    this.loginCount += 1;
    return this.save();
};

userSchema.methods.hasPermission = function(permission) {
    const rolePermissions = {
        admin: [
            'manage_users', 'manage_classes', 'manage_students', 
            'manage_teachers', 'view_reports', 'manage_settings',
            'delete_data', 'export_data'
        ],
        prof: [
            'view_my_classes', 'manage_my_students', 'create_reports',
            'view_my_statistics', 'update_grades', 'manage_attendance'
        ],
        eleve: [
            'view_my_profile', 'view_my_grades', 'view_my_schedule',
            'contact_teachers'
        ],
        public: [
            'view_public_info', 'contact_school'
        ]
    };
    
    const basePermissions = rolePermissions[this.role] || [];
    const customPerms = Object.keys(this.customPermissions).filter(
        perm => this.customPermissions[perm]
    );
    
    return [...basePermissions, ...customPerms].includes(permission);
};

let model;

if (!mongoose.modelNames().includes("ai_Users_Ecole_St_Martin")) {
    model = mongoose.model('ai_Users_Ecole_St_Martin', userSchema);
} else {
    model = mongoose.model("ai_Users_Ecole_St_Martin");
}

module.exports = model;
