$(function() {

    // Sample Contacts
    var contacts = [
        { id: 0, fName: "Contact", lName:"One", phoneNumber: "0123456789", email: "anemail@me.com"},
        { id: 1, fName: "Contact", lName:"Two", phoneNumber: "0123456789", email: "anemail@me.com"},
        { id: 2, fName: "Contact", lName:"Three", phoneNumber: "0123456789", email: "anemail@me.com" },
        { id: 3, fName: "Contact", lName:"Four", phoneNumber: "0123456789", email: "anemail@me.com"},
        { id: 4, fName: "Contact", lName:"Five", phoneNumber: "0123456789", email: "anemail@me.com"},
        { id: 5, fName: "Contact", lName:"Six", phoneNumber: "0123456789", email: "anemail@me.com"},
        { id: 6, fName: "Contact", lName:"Seven", phoneNumber: "0123456789", email: "anemail@me.com"},
        { id: 7, fName: "Contact", lName:"Eight", phoneNumber: "0123456789", email: "anemail@me.com"}
    ];
    //Model
    var Contact = Backbone.Model.extend({
    	
	    defaults: {
	        address: "Not Defined",
	        phoneNumber: "Not Defined",
	        email: "Not Defined",
	    },
	    validate: function(attr){
	    	if(!attr.fName && !attr.lName ){
	    		return "Contact must have at least first name or last name";
	    	}
	    }
	});

	//Collection of Contact Model
	var ContactCollection = Backbone.Collection.extend({
	    model: Contact
	});
	//View of Each Contact for List/Search
	var ListContactView = Backbone.View.extend({
		render: function(){
			var template = _.template( $("#list-template").html(), this.model.toJSON() );
			return this.$el.html( template );
		}
	});
	// var HomeView = Backbone.View.extend({
	// 	el: $("#home"),
	// 	render: function(){
	// 		var template = _.template($("#home-template").html(),{});
	// 		return template;
	// 	}
	// });
	//View for Viewing Contact
	var SingleContactView = Backbone.View.extend({
		el: $("#view"),
		render: function(){
			var template = _.template($("#view-template").html(),this.model.toJSON());
			return this.$el.html(template);
		},
		events:{
			"click .edit": "edit",
			"click .delete": "delete"
		},
		delete: function(){
			if(confirm("Are you sure to delete "+this.model.get("fName")+" "+this.model.get("lName")+"?")){
				this.collection.remove(this.model);
				//this.model.destroy();
				this.remove();
				ContactManagerRouter.navigate("",{trigger:true})
			}
		},
		edit: function(){
			ContactManagerRouter.navigate("edit/"+this.model.get("id"),{trigger:false});
			this.remove();
			ContactManagerRouter.editContactbyModel(this.model);
		}
	});
	//Edit View
	var EditView = Backbone.View.extend({
		el: $("#edit"),
		render: function(){
			var template = _.template($("#edit-template").html(),this.model.toJSON());
			return this.$el.html(template);
		},
		events: {
			"submit": "submitForm",
			"click #cancel": "cancel"
		},
		submitForm: function(ev){
			ev.preventDefault();

			var contact = this.model;
			this.$el.find('input[name]').each(function() {
                    contact.set(this.name, this.value);
            });
            this.model= contact;
            ContactManagerRouter.navigate("view/"+this.model.get("id"),{trigger:true});
		},
		cancel: function(){
			ContactManagerRouter.navigate("view/"+this.model.get("id"),{trigger:true});
			this.remove();
		}
	});
	//Main View
	var MainView = Backbone.View.extend({
		el: $("body"),
		//homeHTML: new HomeView(),
		render: function(collection){
			$(".row").empty();
			_.each(collection.models,function(contact){
				this.createSingleViewForList(contact);
			},this);
		},
		// showHome: function(){
		// 	$(".row").empty().append(new HomeView().render());
		// },
		createSingleViewForList: function(contact){
			var contactView = new ListContactView({model: contact});
			$(".row").append(contactView.render());
		},
		//events
		events:{
			"click #searchBtn": "search",
			"keypress #search": "searchOnKeypress",
			"submit #new-contact-form": "onNewContactFormSubmit"
		},
		search: function(){
			ContactManagerRouter.navigate('search/'+$("#search").val(),{trigger: true})
		},
		searchOnKeypress: function(ev){
			var keycode = (ev.keyCode ? ev.keyCode : ev.which);
			if(keycode==13){
				this.search();
			}
		},
		viewContact: function(contact,collection){
			$(".row").empty().append(new SingleContactView({model: contact,collection:collection}).render());
		},
		editContact: function(contact){
			var a= new EditView({model: contact}).render();
			$(".row").empty().append(a);
		},
		onNewContactFormSubmit: function(ev){
			ev.preventDefault();
			var contact = new Contact();
			this.$("#new-contact-form").find('input[name]').each(function() {
                    contact.set(this.name, this.value);
            });
           contact.set("id",ContactManagerRouter.allContacts.last().get("id")+1);
           ContactManagerRouter.allContacts.add(contact);
           $("#myModal").modal('hide');
           ContactManagerRouter.navigate("all",{trigger:true});

		}
	});

	//Router
	var appRouter = Backbone.Router.extend({

		allContacts: new ContactCollection(contacts),
		contactList: new MainView({collection: this.allContacts}),
		
        routes: {	
        	'search/:keyword' : 'searchByKeyword',
        	'view/:id' : 'view',
        	'edit/:id': 'editContactById',
        	'new': 'newContact',
        	//'all': 'showAll',
            '*path':  'showAll'
        },
        // defaultRoute: function(){
        // 	this.contactList.showHome();
        // },
        showAll: function(){
        	this.contactList.render(this.allContacts);
        },
        searchByKeyword: function(keyword){
			if(keyword==""){
				contactList.render(this.allContacts);
				return;
			}
			var searchResult = this.allContacts.filter(function(model) {
			    return _.any(model.attributes, function(val, attr) {
			        return (typeof(val)=="string")? ~val.toLowerCase().indexOf(keyword.toLowerCase()): false;
			        
			    });;
			});
			var searchResultCollection = new ContactCollection(searchResult);
			if(searchResultCollection.length>0){
				$(".row").empty();
				this.contactList.render(new ContactCollection(searchResult));
			}else{
				$(".row").html("No result found.");
			}
		},
		view: function(id){	
			var model = this.allContacts.findWhere({id: parseInt(id)});
			this.contactList.viewContact(model,this.allContacts);
		},
		editContactById: function(id){
			var model = this.allContacts.findWhere({id: parseInt(id)});
			this.contactList.editContact(model,this.allContacts);
		},
		editContactbyModel: function(model){
			this.contactList.editContact(model,this.allContacts);
		},
		newContact: function(){
			$("#new-contact-link").click();
		}
    });
    
    var ContactManagerRouter = new appRouter();
	Backbone.history.start();

});