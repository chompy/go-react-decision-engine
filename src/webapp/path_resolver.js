import ErrorPageComponent from "./components/pages/error";
import FormDashboardPageComponent from "./components/pages/form_dashboard";
import FormSubmissionEditPageComponent from "./components/pages/form_submission_edit";
import FormSubmissionListPageComponent from "./components/pages/form_submission_list";
import LoginPageComponent from "./components/pages/login";
import TreeListPageComponent from "./components/pages/tree_list";
import TreeVersionEditPageComponent from "./components/pages/tree_version_edit";
import TreeVersionListPageComponent from "./components/pages/tree_version_list";
import { APP_TITLE, ERR_NOT_FOUND, ERR_NOT_IMPLEMENTED } from "./config";


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
                    return {component: ErrorPageComponent, team: teamId, message: ERR_NOT_IMPLEMENTED};
                }
                switch (path[1]) {
                    case 'login': {
                        return {component: LoginPageComponent, team: teamId};
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
                    case 'admin': {
                        if (path.length == 2) {
                            return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                        }
                        switch (path[2]) {
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
                                            return {component: FormSubmissionListPageComponent, team: teamId, id: formId};
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
                            default: {
                                return {component: ErrorPageComponent, team: teamId, message: ERR_NOT_FOUND};
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
     * @param {string} path 
     * @param {string} title 
     */
    static setPath(path, title) {
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
        let componentList = {
            // public pages
            '{team}/login': LoginPageComponent,
            // normal user pages
            '{team}/form/{id}': FormSubmissionEditPageComponent,            
            // admin pages
            '{team}/admin/docs/{id}': TreeListPageComponent,
            '{team}/admin/forms': TreeListPageComponent,
            '{team}/admin/form/{id}/submissions': FormSubmissionListPageComponent,
            '{team}/admin/form/{id}': FormDashboardPageComponent,
            '{team}/admin/tree/{id}/v{version}': TreeVersionEditPageComponent,
            '{team}/admin/tree/{id}': TreeVersionListPageComponent
        };
        for (let path in componentList) {
            let tComp = componentList[path];
            if (component == tComp) {
                for (let k in params) {
                    path = path.replace('{' + k.toLowerCase() + '}', params[k]);
                }
                if (path.includes('}') || path.includes('{')) { continue; }
                PathResolver.setPath(path, component.getTitle());
                return;
            }
        }
    }

}
