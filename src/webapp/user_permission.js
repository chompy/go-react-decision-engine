
export const USER_PERM_ADMIN = 'admin';
export const USER_PERM_USER_MANAGE = 'manage_user';
export const USER_PERM_FORM_MANAGE = 'manage_form';
export const USER_PERM_DOCUMENT_MANAGE = 'manage_document';
export const USER_PERM_SUBMISSION_MANAGE = 'manage_submission';
export const USER_PERM_RULE_TEMPLATE_MANAGE = 'manage_rule_template';

export default class UserPermission {

    static userPermissionMap = {
        [USER_PERM_ADMIN]: 'Admin (Full Privilege)',
        [USER_PERM_USER_MANAGE]: 'Create/Edit/Delete Users',
        [USER_PERM_FORM_MANAGE]: 'Create/Edit/Delete Forms',
        [USER_PERM_DOCUMENT_MANAGE]: 'Create/Edit/Delete Documents',
        [USER_PERM_SUBMISSION_MANAGE]: 'Create/Edit/Delete Form Submissions',
        [USER_PERM_RULE_TEMPLATE_MANAGE]: 'Create/Edit/Delete Rule Templates'
    };

    /**
     * Return true if user has given permission.
     * @param {Object} user 
     * @param {String} perm 
     * @return {Boolean}
     */
    static userCan(user, perm) {
        return user?.permission && (
            user?.permission.indexOf(USER_PERM_ADMIN) != -1 ||
            user?.permission.indexOf(perm) != -1
        );
    }

}