export const routes = [{
    path: '/translates/',
    component: () =>  import ('@controleonline/ui-layout/src/layouts/AdminLayout.vue'),
    children: [
      {
        name: 'TranslateIndex',
        path: '',
        component: () =>  import ('@controleonline/ui-translate/src/pages/Menu.vue'),
      },    
      {
        name: "translateDetails",
        path: "id/:id",
        component: () => import("@controleonline/ui-translate/src/pages/Details.vue"),
      }      
    ]
  }];
  
  export default routes
  