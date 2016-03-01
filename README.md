# gdtsalesui
GDT Sales UI

### Github Setup steps
* https://help.github.com/articles/set-up-git/#platform-windows
* Create a new user account on Github. Add the user as a collaborator to rafidude/gdtsalesui repository

#### Download latest JDK from Oracle and install it

#### Java Security Command on Mac
* Find the file cacerts in /Library/Java/JavaVirtualMachines/jdk1.8.0_60.jdk/Contents/Home/jre/lib/security where the jdk version number is which ever one you’ve installed
* chmod 777 cacerts
* keytool -keystore cacerts -importcert -alias equifaxsecureca -file <filename.cer> 

#### Java Security Command on Windows
"C:\Program Files\Java\jdk1.8.0_71\jre\bin\keytool.exe"  -keystore cacerts -importcert -alias equifaxsecureca2 -file _.generaldatatech.com.cer

#### On Mac brew install tomcat
#### On Windows use Eclipse/Tomcat
#### Cisco Anyconnect

### SAP Transports
* SAP Codes (Use /n before all transaction codes)
* SE10 : Transports
* Create New Transport
* Workbench Request
  * Description for feature
  * Copy HEDK908613
* /nSE38 -> New session

### New Transport:
* /ose10
* New
* Workbench Req

* HEDK908917
* SE38:  Run Modules
  * Program: /UI5/UI5_REPOSITORY_LOAD
  * Do not create -> Run tick sign
  * Name of SAPUI5 App: z_gdt_salesui
  * Execute
  * Source Directory: /Users/agilesense/code/gdt_salesui/WebContent
  * Scroll to the bottom: Click green button -> Upload
  * Transport Request Number: HEDK908613

### Add a new field to Order Detail Lines
#### To find the location of new column
* /nse80
* Drop down: Package
* ZSALESAPP
* click glasses icon
* Under ZSALESAPP Dictionary Objects
	* Structures
		* double click ZSALESDETAILLINE
		* Look up select statement from /nsegw
		* Make sure you add the field after SELECT end

#### Adding a new field:
* /nsegw -> Gateway Service Builder
* Z_SALESUI_ENTITY
	* Service Implementation
		* SalesDocumentDetailSet
			* GetEntitySet (Query) -> Double-click Method Name to see code
			* Go get the data
		* SalesDocumentDetail
			* Add a new field to the end of SELECT
	* exit out of segw

* /nsegw -> Go back into it so cached version..only when you add/delete fields
* Z_SALESUI_ENTITY
	* Data Model
		* Entity Types
			* SalesDocumentDetail
				* Properties
					* Add the filed

#### To refresh code - otherwise cached
* Program: /UI5/APP_INDEX_CALCULATE
  * Based on Single repository
* z_gdt_salesui

#### segw: gateway, to see oData interfaces
* Z_SALES_ENTITY
* UserPref
