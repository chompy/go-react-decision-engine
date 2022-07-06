import ErrorPageComponent from "./components/pages/error";
import FormDashboardPageComponent from "./components/pages/form_dashboard";
import FormSubmissionEditPageComponent from "./components/pages/form_submission_edit";
import LoginPageComponent from "./components/pages/login";
import TreeListPageComponent from "./components/pages/tree_list";
import TreeVersionEditPageComponent from "./components/pages/tree_version_edit";
import TreeVersionListPageComponent from "./components/pages/tree_version_list";
import { APP_TITLE, ERR_NOT_FOUND, ERR_NOT_IMPLEMENTED } from "./config";


/**
 * /login/{teamId}
 * /forms                           | List all forms for team.
 * /form/{id}/{version}             | Create submission of given version of form.
 * /documents/{id}                  | List documents for given form.
 * /tree/{id}                       | List versions for given tree.
 * /tree/{id}/{version}             | Edit given tree version.
 * /f/{id}
 * 
 * /form/{id}/v{version}
 */



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
                    case 'edit': {
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
            '{team}/login': LoginPageComponent,
            '{team}/edit/docs/{id}': TreeListPageComponent,
            '{team}/edit/forms': TreeListPageComponent,
            '{team}/edit/form/{id}': FormDashboardPageComponent,
            '{team}/edit/tree/{id}/v{version}': TreeVersionEditPageComponent,
            '{team}/edit/tree/{id}': TreeVersionListPageComponent,
            '{team}/form/{id}/{submission}': FormSubmissionEditPageComponent,
            '{team}/form/{id}': FormSubmissionEditPageComponent
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
