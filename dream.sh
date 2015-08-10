node tasks/sync_trello.js
node tasks/download_shortlisted_profiles.js
read -p "Convert the xls to xlsx manually!!  Press any key to continue... " -n1 -s
node tasks/process_shortlisted_profiles.js
node tasks/complete_profiles.js
node tasks/tools/cloudinary_cleaner.js
node tasks/cloudify_images.js
#node tasks/publish_trello.js
