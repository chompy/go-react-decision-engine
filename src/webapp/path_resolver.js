import DocumentViewComponent from "./components/pages/document_view";
import DocumentViewListComponent from "./components/pages/document_view_list";
import ErrorPageComponent from "./components/pages/error";
import FormDashboardPageComponent from "./components/pages/form_dashboard";
import FormSubmissionEditPageComponent from "./components/pages/form_submission_edit";
import FormSubmissionListPageComponent from "./components/pages/form_submission_list";
import LoginPageComponent from "./components/pages/login";
import RuleTemplateEditPageComponent from "./components/pages/rule_template_edit";
import RuleTemplateListPageComponent from "./components/pages/rule_template_list";
import TeamDashboardPageComponent from "./components/pages/team_dashboard";
import TreeListPageComponent from "./components/pages/tree_list";
import TreeVersionEditPageComponent from "./components/pages/tree_version_edit";
import TreeVersionListPageComponent from "./components/pages/tree_version_list";
import UserEditPageComponent from "./components/pages/user_edit";
import UserListPageComponent from "./components/pages/user_list";
import { ERR_NOT_FOUND, ERR_NOT_IMPLEMENTED } from "./config";
import TeamCustomizePageComponent from "./components/pages/team_customize";
import UserDashboardPageComponent from "./components/pages/user_dashboard";

// Determines pages and page parameters from current URL path.
export default class PathResolver {

    /**
     * Given path, resolve page component and parameters.
     * @param {string} path 
     * @returns {Array}
     */
    static resolvePath(path) {
        path = path.trim();
        if (path[0] == '/') {
            path = path.substring(1);
        }
        path = path.trim().split('/');
        if (!path) {
            return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
        }
        switch (path[0]) {
            case '': {
                return {component: ErrorPageComponent, message: ERR_NOT_IMPLEMENTED};
            }
            default: {
                let teamId = path[0];
                if (!teamId) {
                    return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                }
                if (path.length == 1 || path[1] == '') {
                    return {component: UserDashboardPageComponent, team: teamId};
                }
                switch (path[1]) {
                    case 'login': {
                        return {component: LoginPageComponent, team: teamId};
                    }
                    case 'customize': {
                        return {component: TeamCustomizePageComponent, team: teamId};
                    }
                    case 'form': {
                        if (path.length == 2) {
                            return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                        }
                        let formId = path[2].trim();
                        if (!formId) {
                            return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                        }
                        if (path.length == 3) {
                            return {component: FormSubmissionEditPageComponent, team: teamId, id: formId};
                        }
                        let submissionId = path[3].trim();
                        return {component: FormSubmissionEditPageComponent, team: teamId, id: formId, submission: submissionId};                        
                    }
                    case 'view': {
                        if (path.length == 2) {
                            return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                        }
                        let submissionId = path[2].trim();
                        if (path.length >= 4) {
                            let documentId = path[3].trim();
                            let versionNo = null;
                            if (path.length >= 5) {
                                versionNo = parseInt(path[4].trim().substring(1));
                            }
                            return {component: DocumentViewComponent, team: teamId, submission: submissionId, document: documentId, version: versionNo};    
                        }
                        return {component: DocumentViewListComponent, team: teamId, id: submissionId};
                    }
                    case 'admin': {
                        if (path.length == 2) {
                            return {component: TeamDashboardPageComponent, team: teamId};
                        }
                        switch (path[2]) {
                            case 'user': {
                                if (path.length < 4) {
                                    return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                }
                                switch (path[3]) {
                                    case 'list': {
                                        return {component: UserListPageComponent, team: teamId};
                                    }
                                    case 'edit': {
                                        if (path.length < 5) {
                                            return {component: UserEditPageComponent, team: teamId};
                                        }
                                        let userId = path[4];
                                        return {component: UserEditPageComponent, team: teamId, id: userId};
                                    }
                                    default: {
                                        return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                    }
                                }
                            }
                            case 'forms': {
                                return {component: TreeListPageComponent, team: teamId};
                            }
                            case 'docs': {
                                if (path.length < 4) {
                                    return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                }
                                let formId = path[3];
                                return {component: TreeListPageComponent, team: teamId, id: formId};
                            }
                            case 'form': {
                                if (path.length < 4) {
                                    return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                }
                                let formId = path[3];
                                if (path.length >= 5) {
                                    switch (path[4]) {
                                        case 'submissions': {
                                            let ref = null;
                                            if (path.length >= 6) {
                                                ref = path[5].substring(4);
                                            }
                                            return {component: FormSubmissionListPageComponent, team: teamId, id: formId, ref: ref};
                                        }
                                        default: {
                                            return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                        }
                                    }
                                }
                                return {component: FormDashboardPageComponent, team: teamId, id: formId};
                            }
                            case 'tree': {
                                if (path.length < 4) {
                                    return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                }
                                let treeId = path[3];
                                if (path.length == 4) {
                                    return {component: TreeVersionListPageComponent, team: teamId, id: treeId};
                                }
                                let versionNo = parseInt(path[4].substring(1));
                                if (!versionNo) {
                                    return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                }
                                return {component: TreeVersionEditPageComponent, team: teamId, id: treeId, version: versionNo};
                            }
                            case 'rule': {
                                if (path.length < 4) {
                                    return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                }
                                switch (path[3]) {
                                    case 'list': {
                                        return {component: RuleTemplateListPageComponent, team: teamId};
                                    }
                                    case 'edit': {
                                        if (path.length < 5) {
                                            return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                        }
                                        let ruleId = path[4];
                                        return {component: RuleTemplateEditPageComponent, team: teamId, id: ruleId};
                                    }
                                    default: {
                                        return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                                    }
                                }
                            }
                            default: {
                                return {component: TeamDashboardPageComponent, team: teamId};
                            }
                        }
                    }
                }
            }
        }
        return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
    }

    /**
     * @returns {Array}
     */
    static resolveCurrentPath() {
        return PathResolver.resolvePath(window.location.pathname);
    }

    /**
     * @param {*} component 
     * @param {Object} params 
     */
    static getPathFromComponent(component, params) {
        let componentList = {
            // public pages
            '{team}/login': LoginPageComponent,
            // normal user pages
            '{team}': UserDashboardPageComponent,
            '{team}/form/{id}': FormSubmissionEditPageComponent,
            '{team}/view/{id}': DocumentViewListComponent,
            '{team}/view/{submission}/{document}/v{version}': DocumentViewComponent,
            '{team}/view/{submission}/{document}': DocumentViewComponent,
            // admin pages
            '{team}/admin': TeamDashboardPageComponent,
            '{team}/customize': TeamCustomizePageComponent,
            '{team}/admin/user/list': UserListPageComponent,
            '{team}/admin/user/edit/{id}': UserEditPageComponent,
            '{team}/admin/user/edit': UserEditPageComponent,
            '{team}/admin/docs/{id}': TreeListPageComponent,
            '{team}/admin/forms': TreeListPageComponent,
            '{team}/admin/form/{id}/submissions/ref-{ref}': FormSubmissionListPageComponent,
            '{team}/admin/form/{id}/submissions': FormSubmissionListPageComponent,
            '{team}/admin/form/{id}': FormDashboardPageComponent,
            '{team}/admin/tree/{id}/v{version}': TreeVersionEditPageComponent,
            '{team}/admin/tree/{id}': TreeVersionListPageComponent,
            '{team}/admin/rule/list': RuleTemplateListPageComponent,
            '{team}/admin/rule/edit/{id}': RuleTemplateEditPageComponent
        };
        for (let path in componentList) {
            let tComp = componentList[path];
            if (component == tComp) {
                for (let k in params) {
                    if (!params[k]) { continue; }
                    path = path.replace('{' + k.toLowerCase() + '}', params[k]);
                }
                if (path.includes('}') || path.includes('{')) { continue; }
                return path;
            }
        }
    }
    
    /**
     * @param {string} path 
     */
    static setPath(path) {
        if (path[0] != '/') {
            path = '/' + path;
        }
        history.pushState({}, '', path);
    }

    /**
     * @param {*} component 
     * @param {Object} params 
     */
    static setPathFromComponent(component, params) {
        PathResolver.setPath(PathResolver.getPathFromComponent(component, params));
    }

}
