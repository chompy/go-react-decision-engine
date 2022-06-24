import ErrorPageComponent from "./components/pages/error";
import FormListPageComponent from "./components/pages/form_list";
import LoginPageComponent from "./components/pages/login";
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
                    case 'forms': {
                        return {component: FormListPageComponent, team: teamId};
                    }
                    case 'tree': {
                        if (path.length < 3) {
                            return {component: ErrorPageComponent, message: ERR_NOT_FOUND};
                        }
                        let treeId = path[2];
                        if (path.length < 4) {
                            return {component: TreeVersionListPageComponent, team: teamId, id: treeId};
                        }
                        // TODO
                        return {component: ErrorPageComponent, team: teamId, message: ERR_NOT_IMPLEMENTED};
                    }
                    default: {
                        return {component: ErrorPageComponent, team: teamId, message: ERR_NOT_FOUND};
                    }
                }
            }
        }
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
        window.title = title + ' - ' + APP_TITLE;
        if (path[0] != '/') {
            path = '/' + path;
        }
        history.pushState({}, window.title, path);
    }

    /**
     * @param {*} component 
     * @param {Object} params 
     */
    static setPathFromComponent(component, params) {
        let componentList = {
            [LoginPageComponent]: '{team}/login',
            [FormListPageComponent]: '{team}/forms',
            [TreeVersionListPageComponent]: '{team}/tree/{id}'
        };
        if (component in componentList) {
            let path = componentList[component];
            for (let k in params) {
                path = path.replace('{' + k.toLowerCase() + '}', params[k]);
            }
            PathResolver.setPath(path, component.getTitle());
        }

    }

}
