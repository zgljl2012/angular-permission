
var App = angular.module("app",['ui.router']);

App.config(function($stateProvider, $urlRouterProvider)
	{
		$urlRouterProvider.otherwise("tab1");
		$stateProvider
			.state('tab1', {
				name: 'tab1',
				url: '/tab1',
				template: '窗前明月光'
			})

			.state('tab2', {
				name: 'tab2',
				url: '/tab2',
				template: '疑是地上霜'
			})

			.state('tab3', {
				name: 'tab3',
				url: '/tab3',
				template: '举头望明月'
			})

			.state('tab4', {
				name: 'tab4',
				url: '/tab4',
				template: '低头思故乡'
			})
			.state('permission-limit',{
				name:"permission-limit",
				url:"/permission/limit",
				template:"访问受限"
			})
			;
	})

App.controller("myCtrl", function($scope, $state, $window, $location){
	// 默认为普通用户
	$scope.role="user";
	$scope.go = function(state) {
		$state.go(state);
	}
	// 在sessionStorage中获取或存储用户信息，此处直接存储了，省略登录这一步骤
	if($window.sessionStorage.USER == null) 
		$window.sessionStorage.USER = angular.toJson({
			"username":"",
			"realname":"",
			"role":$scope.role
			// 等等一切你需要的属性
		});
	else {
		var user = angular.fromJson($window.sessionStorage.USER);
		$scope.role = user.role;
	}
	// 监听用户角色变化
	$scope.$watch('role', function(newVal, oldVal, scope) {
		var user = angular.fromJson($window.sessionStorage.USER);
		user.role = newVal;
		$window.sessionStorage.USER = angular.toJson(user);
		if(oldVal != null && oldVal != newVal) {
			console.log(1);
			$window.location.reload();
		}
	})
})

/**
 * 自定义服务，基于角色的访问控制
 */
App.service("auth", ["$http","$window", function($http, $window){  
    var roles = []; // 从后端数据库获取的角色表
    // 从后端获取的角色权限Url映射表，结构为{"role":["/page1", "/page2"……]}
    var urlPermissions = {};
    // 去后端获取
    (function(){
      // 此处为测试方便，直接赋值了，下面也仅以示例为目的，尽量简单了
      roles = ["admin", "user"]
      urlPermissions = {
        // 管理员可以访问所用页面，此处实现了通配符
        "admin":["*"], 
        // 普通用户可以访问page路径下的所有界面（登录、注册等页面）以及系统主页
        "user":["tab1", "tab2", "permission-limit"] 
      }
    })();
    function convertState(state) {
      return state.replace(".", "\\\.").replace("*", ".*");
    }
    return {
      // 是否有访问某url的权限
      isAccessUrl:function(url) {
        var user = angular.fromJson($window.sessionStorage.USER);
        for(var role in roles) {
			if(user.role.toLowerCase() == roles[role].toLowerCase()) {
            for(i in urlPermissions[roles[role]]) {
              var regx = eval("/"+convertState(urlPermissions[roles[role]][i])+"/");
              if(regx.test(url)) {
                return true;
              }
            }
          }
        }
        return false;
      }
    }

}])

/**
 * 监听路由状态变化
 */

App.run(["$rootScope",'$state', "auth",'$window', function($rootScope, $state, auth, $window){  
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    // 路由访问控制
    if(toState.name!='permission-limit'&&!auth.isAccessUrl(toState.name)) {  
      var user = angular.fromJson($window.sessionStorage.USER);
      if(user == null) {
		// 如果是正式开发，此处应该跳转至登录界面
      }
      event.preventDefault();
      $state.go("permission-limit");  
    }
});
}])

/**
 * 元素级别的访问控制指令
 */
App.directive("zgAccess", function($window, $http){  
  var roles = []; // 角色
  var elemPermissions = {}; // 角色元素权限映射表，如{ "role":{"SEARCH"}}，role有这个搜索权限

  // 后台获取
  (function(){
    // 简便起见，这里直接生成
    roles = ["admin", "user"];
    elemPermission = {
      "admin":["btn01","btn02","btn03"],
      "user":["btn01"]
    }
  })();
  console.log("zg-access");
  return {
    restrict: 'A',
    compile: function(element, attr) {
        // 初始为不可见状态none，还有 禁用disbaled和可用ok，共三种状态
        var level = "none";
        if(attr && attr["zgAccessLevel"]) {
          level = attr["zgAccessLevel"];
        }
        switch(level) {
          case "none": element.hide(); break;
          case "disabled": 
            element.attr("disabled", "");
            break;
        }
        // 获取元素权限
        var access = attr["zgAccess"];
        // 将此权限上传到后端的数据库
        (function(){
         //upload 
        })();
        return function(scope, element) {
          // 判断用户有无权限
          var user = angular.fromJson($window.sessionStorage.USER);
          if(user==null||angular.equals({}, user)) {
            user = {};
            user.role = "user";
          }
		  if(user.role == null) {
			  user.role = "user";
		  }
          var role = user.role.toLowerCase();
          for(var i in roles) {
			var tmp = roles[i].toLowerCase();
            if(role == tmp) {
              tmp = elemPermission[role];
              for(var j in tmp){
                if(access.toLowerCase() == tmp[j].toLowerCase()) {
                  element.removeAttr("disabled");
                  element.show();
                } 
              }
            }
          }
        };
      }
  }
})

